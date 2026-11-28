import { esc, $, $$, toast, getJSON } from '../util.js';
import { store } from '../store.js';
import { aiReady, aiChat, aiQuestions } from '../ai.js';
import { buildPlan } from './more.js';
import { startDrill } from './week.js';

const SUBJ = { q: ['Quant', 'quant'], r: ['Reasoning', 'reasoning'], e: ['English', 'english'], g: ['General Awareness', 'ga'] };
const cache = {};
async function lesson(key) { const f = key.split('-')[0]; if (!(f in cache)) { try { cache[f] = await getJSON(`data/lessons/${f}.json`); } catch { cache[f] = {}; } } return cache[f][key] || null; }
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^\s*[-*] (.+)$/gm, '• $1').replace(/\n/g, '<br>');
const SYS = `You are a patient one-to-one tutor for an Indian student preparing for SSC CGL (target: Assistant Section Officer, Ministry of External Affairs). Teach in simple English, in small steps, with one worked example at a time. Use exact numbers and short lines. Do not dump everything at once: teach one idea, then stop and ask the student a quick check question, or wait for them to say Next. Never invent page numbers, quotes or facts from books; when pointing to a book, name the chapter only and tell the student to confirm in the book. If a calculation is involved, verify it step by step. If unsure of a fact, say so. Keep each reply under 220 words.`;

export async function render(app, args) {
  const { weeks } = await buildPlan();
  let [mode, wn, k, p] = args; // #/tutor/week/N/k/p
  const st = { wn: +wn || 0, k: k || 'q', p: +p || 0, free: '' };
  let L = null, msgs = [], image = null;
  const ckey = () => 'tutor:' + (st.wn ? `${st.wn}:${st.k}:${st.p}` : 'free:' + st.free.toLowerCase().slice(0, 40));
  const ctxText = () => {
    if (!st.wn) return st.free ? `Topic chosen by the student: ${st.free}.` : '';
    const P = L?.units?.[st.k]?.parts?.[st.p]; if (!P) return `Week ${st.wn}, ${SUBJ[st.k][0]}. No written lesson yet; teach the topics: ${weeks[st.wn - 1].w[st.k]}.`;
    return `Week ${st.wn}, ${SUBJ[st.k][0]}: ${L.units[st.k].title}, ${P.name}.\nBooks: ${P.read.map(r => r.book + ' (' + r.where + ')').join('; ')}.\nKey notes the student must learn:\n- ${P.notes.join('\n- ')}\nWorked examples:\n${P.examples.map(e => `Q: ${e.q} A: ${e.a} ${e.s || ''}`).join('\n')}`;
  };
  async function load() { L = st.wn ? await lesson(weeks[st.wn - 1].key) : null; msgs = store.get(ckey(), []); }
  async function send(text, opts = {}) {
    if (!aiReady()) return toast('Add your Gemini key in More → Settings first', 4000);
    msgs.push({ role: 'user', text }); draw(true);
    try {
      const reply = await aiChat({ system: SYS + '\n\nLESSON CONTEXT:\n' + ctxText(), messages: msgs.slice(-14), image: opts.image });
      msgs.push({ role: 'model', text: reply });
    } catch (e) { msgs.pop(); toast(e.message, 5000); }
    image = null; store.set(ckey(), msgs.slice(-40)); draw();
  }
  function draw(busy) {
    const picker = `<div class="card"><div class="row" style="gap:6px;flex-wrap:wrap">
      <select id="tw" class="sp"><option value="0">Free topic</option>${weeks.map((w, i) => `<option value="${i + 1}" ${st.wn === i + 1 ? 'selected' : ''}>Week ${i + 1}</option>`).join('')}</select>
      ${st.wn ? `<select id="tk">${Object.entries(SUBJ).map(([x, v]) => `<option value="${x}" ${st.k === x ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
      <select id="tp">${[0, 1, 2].map(i => `<option value="${i}" ${st.p === i ? 'selected' : ''}>${esc(L?.units?.[st.k]?.parts?.[i]?.name || 'Part ' + (i + 1))}</option>`).join('')}</select>`
      : `<input id="tf" class="sp" placeholder="Type any topic, e.g. Percentages" value="${esc(st.free)}">`}</div></div>`;
    app.innerHTML = `<h1>AI tutor</h1><p class="sub">Teaches step by step from your lesson notes and its own knowledge. It does not have the books themselves: for a book page, take a photo or paste the text.</p>${picker}
    ${aiReady() ? '' : '<div class="note">Add your free Gemini key in <a href="#/more/settings">Settings</a> to use the tutor. Everything else in the app works without it.</div>'}
    <div class="card" id="chat" style="max-height:48vh;overflow:auto">${msgs.length ? msgs.map(m => `<div style="margin:8px 0;${m.role === 'user' ? 'text-align:right' : ''}"><div style="display:inline-block;max-width:92%;text-align:left;padding:8px 12px;border-radius:12px;background:${m.role === 'user' ? 'var(--accent)' : 'var(--card2,rgba(128,128,128,.15))'};${m.role === 'user' ? 'color:#fff' : ''}">${md(m.text)}</div></div>`).join('') : '<p class="sub">Press “Teach me” to begin.</p>'}${busy ? '<p class="sub">Thinking…</p>' : ''}</div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0"><button class="btn sm" id="b-teach">Teach me</button><button class="btn alt sm" id="b-next">Next</button><button class="btn alt sm" id="b-simple">Explain simpler</button><button class="btn alt sm" id="b-ex">Another example</button><button class="btn alt sm" id="b-quiz">Quiz me</button></div>
    <div class="row" style="gap:6px"><input id="msg" class="sp" placeholder="Ask a doubt…"><label class="btn alt sm" style="margin:0">📷<input type="file" id="img" accept="image/*" hidden></label><button class="btn sm" id="snd">Send</button></div>
    <div class="sub" id="imgn">${image ? 'Photo attached' : ''}</div>
    <div class="row" style="gap:6px;margin-top:8px"><button class="btn alt sm" id="b-mk">Make 10 practice questions from this</button><button class="btn alt sm" id="b-clr">Clear chat</button></div>`;
    const ch = $('#chat'); ch.scrollTop = ch.scrollHeight;
    $('#tw').onchange = async e => { st.wn = +e.target.value; st.p = 0; await load(); draw(); };
    if (st.wn) { $('#tk').onchange = async e => { st.k = e.target.value; st.p = 0; await load(); draw(); }; $('#tp').onchange = async e => { st.p = +e.target.value; await load(); draw(); }; }
    else $('#tf').onchange = async e => { st.free = e.target.value.trim(); await load(); draw(); };
    const need = () => (st.wn || st.free) ? true : (toast('Pick a week or type a topic first'), false);
    $('#b-teach').onclick = () => need() && send(msgs.length ? 'Start again from the beginning. Teach the first idea only.' : 'Teach me this lesson from the beginning. First idea only, with one example, then ask me a quick check question.');
    $('#b-next').onclick = () => need() && send('Next idea, please.');
    $('#b-simple').onclick = () => need() && send('I did not understand. Explain the last point in simpler words with a fresh, easy example.');
    $('#b-ex').onclick = () => need() && send('Give me another worked example, then a similar one for me to solve. Wait for my answer.');
    $('#b-quiz').onclick = () => need() && send('Quiz me: ask ONE exam-style question on this topic now. Wait for my answer, then check it and explain.');
    const go = () => { const t = $('#msg').value.trim(); if (!t && !image) return; $('#msg').value = ''; const im = image; send(t || 'Explain what is in this photo, step by step.', { image: im }); };
    $('#snd').onclick = go; $('#msg').onkeydown = e => { if (e.key === 'Enter') go(); };
    $('#img').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const u = String(r.result); image = { mime: f.type || 'image/jpeg', data: u.split(',')[1] }; $('#imgn').textContent = 'Photo attached. Type your question and press Send.'; }; r.readAsDataURL(f); };
    $('#b-clr').onclick = () => { if (confirm('Clear this chat?')) { msgs = []; store.set(ckey(), []); draw(); } };
    $('#b-mk').onclick = async e => {
      if (!need()) return; if (!aiReady()) return toast('Add your Gemini key first');
      e.target.disabled = true; e.target.textContent = 'Writing…';
      try { const sec = SUBJ[st.k][1], qs = await aiQuestions({ sec: st.wn ? sec : 'ga', topic: st.free || undefined, n: 10, context: ctxText() }); toast(qs.length + ' questions added'); if (qs.length) startDrill({ sec: st.wn ? sec : 'ga', topic: qs[0].t, n: Math.min(10, qs.length), min: 10 }); }
      catch (er) { toast(er.message, 5000); } e.target.disabled = false; e.target.textContent = 'Make 10 practice questions from this';
    };
  }
  await load(); draw();
}

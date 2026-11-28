import { esc, $, $$, toast, getJSON } from '../util.js';
import { store } from '../store.js';
import { buildPlan } from './more.js';
import { loadBooks, bookLinks } from '../books.js';
import { pickQuestions, customPaper } from '../data.js';
import { startExam } from '../exam.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SUB = { q: ['Quant', 'quant'], r: ['Reasoning', 'reasoning'], e: ['English', 'english'], g: ['General Awareness', 'ga'] };
const lessonCache = {};
async function lesson(key) {
  const f = key.split('-')[0]; if (!(f in lessonCache)) { try { lessonCache[f] = await getJSON(`data/lessons/${f}.json`); } catch { lessonCache[f] = {}; } }
  return lessonCache[f][key] || null;
}
export async function startDrill(d) {
  const qs = await pickQuestions(d.sec, d.n, { topic: d.topic });
  if (!qs.length) return toast('No questions for this topic yet');
  startExam(await customPaper(d.sec, qs.length, d.min, { qs, name: d.topic + ' drill' }));
}
async function weeklyTest(L, n) {
  const sections = [];
  for (const [k, [name, sec]] of Object.entries(SUB)) {
    const tops = L.testTopics?.[sec]; if (!tops) continue; const per = Math.ceil(10 / tops.length); let qs = [];
    for (const t of tops) qs.push(...await pickQuestions(sec, per, { topic: t }));
    qs = qs.slice(0, 10); if (qs.length) sections.push({ id: sec, name, short: name === 'General Awareness' ? 'GA' : name, minutes: 8, qs });
  }
  startExam({ id: 'p' + Date.now(), testId: 'weekly', name: `Week ${n} test`, correct: 2, wrong: -0.5, lock: true, totalMinutes: sections.length * 8, sections });
}

export async function render(app, [, num]) {
  await loadBooks();
  const { weeks, start } = await buildPlan(), n = Math.min(Math.max(+num || 1, 1), weeks.length), w = weeks[n - 1];
  const L = await lesson(w.key), back = `<a href="#/more/plan" class="sub" style="text-decoration:none">← Study plan</a>`;
  const done = () => store.get('lesson-done', {}), tick = k => { const d = done(); d[k] ? delete d[k] : d[k] = 1; store.set('lesson-done', d); };
  let day = store.get('wk-day:' + n, new Date().getDay() === 0 ? 6 : Math.min(new Date().getDay() - 1, 6));
  if (!L) {
    app.innerHTML = `${back}<h1>Week ${n} · ${esc(w.phase)}</h1><p class="sub">${esc(w.goal)}</p>
    <div class="note">The full day-by-day lesson for this week is not written yet. It is being added week by week. Until then, use the topics and books below.</div>
    <div class="card"><div class="sub">${[['q', 'Quant'], ['r', 'Reasoning'], ['e', 'English'], ['g', 'GA']].map(([k, nm]) => `<b>${nm}:</b> ${esc(w.w[k])}${(w.w.ref?.[k] || []).map(x => `<div style="margin:2px 0 6px 10px">📖 ${esc(x)}${bookLinks(x)}</div>`).join('')}`).join('<br>')}</div></div>`;
    return;
  }
  const drawDay = () => {
    let body = '';
    const sess = (k, p, di) => {
      const U = L.units[k], P = U.parts[p]; const id = s => `${w.key}:${p}:${k}:${s}`; let cnt = 0, tot = 0;
      const chk = (kk) => { tot++; const on = !!done()[kk]; if (on) cnt++; return `<input type="checkbox" data-ck="${kk}" ${on ? 'checked' : ''} style="width:20px;height:20px;margin:2px 10px 0 0;flex:none">`; };
      const html = `
      <h4 class="bh">📖 Read</h4>${P.read.map((r, i) => `<div class="row" style="align-items:flex-start;padding:4px 0">${chk(id('r' + i))}<div><b>${esc(r.book)}</b><div class="sub" style="margin:0">${esc(r.where)}</div>${bookLinks(r.book + ' ' + r.where)}</div></div>`).join('')}
      <h4 class="bh">🧠 Notes to learn</h4><ul class="kp">${P.notes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <h4 class="bh">✏️ Worked examples (try first, then tap)</h4>${P.examples.map(e => `<details class="ex"><summary>${esc(e.q)}</summary><div class="expl"><b>Answer: ${esc(e.a)}</b>${e.s ? '<br>' + esc(e.s) : ''}</div></details>`).join('')}
      <h4 class="bh">🎯 Solve exactly this</h4>${P.solve.map((s, i) => `<div class="row" style="align-items:flex-start;padding:5px 0">${chk(id('s' + i))}<div class="sp"><b>${esc(s.label)}</b>${s.book ? `<div class="sub" style="margin:0">${esc(s.book)}</div>${bookLinks(s.book)}` : ''}${s.drill ? `<div class="sub" style="margin:0">${s.drill.n} questions in ${s.drill.min} min. Target: ${esc(s.drill.target)} accuracy.</div><button class="btn sm" data-dr='${esc(JSON.stringify(s.drill))}' style="margin-top:4px">Start in app</button>` : ''}</div></div>`).join('')}`;
      return `<details class="card" open><summary style="cursor:pointer"><b>${esc(SUB[k][0])}</b> · ${esc(P.name)} <span class="chip" data-cnt="${k}${p}"></span></summary>${html}</details>`.replace('data-cnt', `data-t="${tot}" data-c="${cnt}" data-cnt`);
    };
    if (day <= 2) body = ['q', 'r', 'e', 'g'].map(k => sess(k, day)).join('');
    else if (day === 3) body = `<div class="card"><h3>Revision day</h3><p class="sub">1. Re-read the notes of the part you found hardest this week.<br>2. Redo every question you got wrong from Mon–Wed (More → Practice → wrong-answer notebook).<br>3. Run one extra drill per subject below.</p>${['q', 'r', 'e', 'g'].map(k => L.units[k].parts.map(P => P.solve.filter(s => s.drill).map(s => s.drill)).flat().filter((d, i, a) => a.findIndex(x => x.topic === d.topic) === i).map(d => `<button class="btn alt sm" style="margin:3px 4px 3px 0" data-dr='${esc(JSON.stringify({ ...d, n: Math.min(d.n, 10) }))}'>${esc(d.topic)} × ${Math.min(d.n, 10)}</button>`).join('')).join('')}</div>`;
    else if (day === 4) body = `<div class="card"><h3>Catch-up and previous-year day</h3><p class="sub">• Finish any unticked item from Mon–Wed.<br>• Quant: 30 more previous-year questions from the chapters of this week (Kiran chapterwise book).<br>• Reasoning: 30 more previous-year questions on this week's topics.<br>• English: 20 error-spotting sentences + 1 reading passage.<br>• GA: read this week's Live tab summaries (20 min) and save 5 items.</p><a class="btn alt sm" href="#/news">Open Live updates</a></div>`;
    else if (day === 5) body = `<div class="card"><h3>Weekly test</h3><p class="sub">Four sections of 10 questions, 8 minutes each, locked like the real Test-1. Questions come only from this week's topics. +2 / −0.5.</p><button class="btn block" id="wt">Start Week ${n} test</button><div class="note">Target: 32 marks or more out of 80 on your first try. Then review every wrong answer.</div></div>`;
    else body = `<div class="card"><h3>Review and rest</h3><p class="sub">• Open your Week ${n} test result and read every explanation for wrong answers.<br>• Add your three biggest mistakes to a notebook, with the correct method.<br>• Do 15 minutes of light revision of the formulas and vocabulary (More → Notes).<br>• Mark the week done in the Study plan, then rest.</p><a class="btn alt sm" href="#/mock">See past results</a></div>`;
    $('#wkbody').innerHTML = body;
    $$('#wkbody [data-t]').forEach(c => c.textContent = c.dataset.c + '/' + c.dataset.t);
    $$('[data-ck]').forEach(c => c.onchange = () => { tick(c.dataset.ck); drawDay(); });
    $$('[data-dr]').forEach(b => b.onclick = () => startDrill(JSON.parse(b.dataset.dr)));
    const wt = $('#wt'); if (wt) wt.onclick = async () => { wt.disabled = true; wt.textContent = 'Preparing…'; await weeklyTest(L, n); };
    $$('#dtabs button').forEach((b, i) => b.classList.toggle('on', i === day));
  };
  app.innerHTML = `${back}<h1>Week ${n} · ${esc(w.phase)}</h1><p class="sub">${esc(w.goal)}</p><div class="note">${esc(L.hours)}</div>
  <div class="tabs" id="dtabs">${DAYS.map((d, i) => `<button data-i="${i}">${d}${i < 3 ? ' · ' + ['Part 1', 'Part 2', 'Part 3'][i] : i === 3 ? ' · Revise' : i === 4 ? ' · PYQ' : i === 5 ? ' · Test' : ' · Review'}</button>`).join('')}</div><div id="wkbody"></div>`;
  $$('#dtabs button').forEach(b => b.onclick = () => { day = +b.dataset.i; store.set('wk-day:' + n, day); drawDay(); });
  drawDay();
}

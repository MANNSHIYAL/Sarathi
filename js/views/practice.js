import { esc, $, $$, toast } from '../util.js';
import { store } from '../store.js';
import { config, customPaper, bank, genTopics, pickQuestions } from '../data.js';
import { startExam } from '../exam.js';
import { aiReady, aiQuestions } from '../ai.js';

const SECS = [['quant', 'Quant', 'Arithmetic, algebra, geometry'], ['reasoning', 'Reasoning', 'Series, coding, blood relations'], ['english', 'English', 'Vocab, grammar, idioms'], ['ga', 'General Awareness', 'Static GK + IR/MEA'], ['computer', 'Computer', 'Basics, Excel, security']];
export async function render(app) {
  const b = await bank(), wb = store.get('wrongbook', []);
  let sec = 'quant', n = 15;
  const topics = s => [...new Set([...(genTopics(s) || []), ...b.filter(q => q.s === s).map(q => q.t)])].sort();
  const draw = () => {
    app.innerHTML = `<h1>Practice</h1><p class="sub">Sectional drills with explanations. +2 / −0.5 marking, one timer, free movement.</p>
    <div class="tabs" id="st">${SECS.map(s => `<button data-s="${s[0]}" class="${s[0] === sec ? 'on' : ''}">${s[1]}</button>`).join('')}</div>
    <div class="card"><div class="row"><div class="sp"><b>${esc(SECS.find(s => s[0] === sec)[1])} sectional</b><div class="sub" style="margin:0">${esc(SECS.find(s => s[0] === sec)[2])}</div></div>
    <select id="nq" style="width:auto">${[10, 15, 25, 30].map(x => `<option ${x === n ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    <button class="btn block" id="go" style="margin-top:10px">Start ${n}-question drill (${Math.round(n * 0.6)} min)</button></div>
    <h2>Topic drills</h2><div class="row wrap">${topics(sec).map(t => `<button class="btn alt sm" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <h2>Wrong-answer notebook <span class="chip">${wb.length}</span></h2>
    <div class="card"><p class="sub">Everything you got wrong in any test lands here.</p><button class="btn alt block" id="wb" ${wb.length ? '' : 'disabled'}>Retry my wrong answers</button></div>
    <h2>AI question maker</h2>
    <div class="card"><p class="sub">${aiReady() ? 'Generate 10 fresh questions for this section into your bank.' : 'Add a free Gemini key in More → Settings to unlock endless new questions.'}</p><button class="btn alt block" id="ai" ${aiReady() ? '' : 'disabled'}>Generate 10 new ${esc(sec)} questions</button></div>`;
    $$('#st button').forEach(x => x.onclick = () => { sec = x.dataset.s; draw(); });
    $('#nq').onchange = e => { n = +e.target.value; draw(); };
    $('#go').onclick = async () => startExam(await customPaper(sec, n, Math.round(n * 0.6), { name: SECS.find(s => s[0] === sec)[1] + ' drill' }));
    $$('[data-t]').forEach(x => x.onclick = async () => { const qs = await pickQuestions(sec, 10, { topic: x.dataset.t }); if (!qs.length) return toast('No questions for this topic yet'); startExam(await customPaper(sec, 10, 6, { qs, name: x.dataset.t })); });
    $('#wb').onclick = async () => { const qs = wb.slice(0, 20).map(w => ({ id: w.id, sec: w.s, topic: w.t, q: w.q, o: w.o, a: w.a, e: w.e })); startExam({ id: 'p' + Date.now(), testId: 'wrongbook', name: 'Wrong-answer retry', correct: 2, wrong: -0.5, lock: false, totalMinutes: 15, sections: [{ id: 'mix', name: 'Mixed', short: 'Mixed', minutes: 15, qs }] }); };
    $('#ai').onclick = async e => { e.target.disabled = true; e.target.textContent = 'Generating…'; try { const r = await aiQuestions({ sec, n: 10 }); toast(r.length + ' new questions added'); } catch (x) { toast(x.message, 4000); } render(app); };
  };
  draw();
}

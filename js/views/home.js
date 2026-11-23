import { esc, daysUntil, dfmt, today } from '../util.js';
import { store, settings, history } from '../store.js';
import { config, customPaper, pickQuestions } from '../data.js';
import { startExam, hasActive } from '../exam.js';
import { currentWeek } from './more.js';
import { examUpdates } from '../ca.js';

export async function render(app) {
  const st = settings.all(), h = history.list(), cfg = await config();
  const d1 = daysUntil(st.tier1Date), d2 = daysUntil(st.tier2Date);
  const days = new Set(h.map(a => new Date(a.ts).toISOString().slice(0, 10))); let streak = 0;
  for (let i = 0; i < 365; i++) { const k = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); if (days.has(k)) streak++; else if (i > 0) break; }
  const tot = h.reduce((a, x) => ({ c: a.c + x.correct, w: a.w + x.wrong }), { c: 0, w: 0 }), acc = tot.c + tot.w ? Math.round(100 * tot.c / (tot.c + tot.w)) : null;
  const cw = await currentWeek(), up = (await examUpdates()).updates?.[0];
  app.innerHTML = `
  <div class="card hero"><div class="sub">Target: SSC CGL 2027 · Post: ASO, Ministry of External Affairs</div>
    <div class="row" style="margin-top:6px"><div class="sp"><div class="big">${d1 > 0 ? d1 : 0}</div><div class="sub" style="margin:0">days to Test-1 (est. ${dfmt(st.tier1Date)})</div></div>
    <div class="sp" style="text-align:right"><div style="font-size:24px;font-weight:700">${d2 > 0 ? d2 : 0}</div><div class="sub" style="margin:0">days to Test-2 (est.)</div></div></div>
    <div class="sub" style="margin:8px 0 0">Dates are planning estimates until SSC announces CGL 2027. Change them in More → Settings.</div></div>
  ${hasActive() ? '<a class="btn block" href="#/exam/run" style="margin-bottom:12px">Resume your exam in progress</a>' : ''}
  <div class="grid3"><div class="stat"><b>${h.length}</b><span>Tests taken</span></div><div class="stat"><b>${acc === null ? '—' : acc + '%'}</b><span>Accuracy</span></div><div class="stat"><b>${streak}🔥</b><span>Day streak</span></div></div>
  <h2>This week</h2>
  <a class="card" href="#/more/plan" style="display:block;color:inherit;text-decoration:none">${cw ? `<div class="row"><b class="sp">Week ${cw.n} of ${cw.total} · ${esc(cw.phase)}</b><span class="chip">Plan</span></div><div class="sub" style="margin:6px 0 0"><b>Quant:</b> ${esc(cw.w.q)}<br><b>Reasoning:</b> ${esc(cw.w.r)}<br><b>English:</b> ${esc(cw.w.e)}<br><b>GA:</b> ${esc(cw.w.g)}</div>` : '<p class="sub">Open the plan to set your start date.</p>'}</a>
  <h2>Quick start</h2>
  <div class="grid2"><button class="btn" id="daily">Daily 10 quiz</button><a class="btn alt" href="#/mock">Full mock</a><a class="btn alt" href="#/practice">Drill a topic</a><a class="btn alt" href="#/more/aso">ASO MEA plan</a></div>
  ${up ? `<h2>Latest exam update</h2><a class="card" style="display:block;color:inherit;text-decoration:none" href="#/news"><div class="t">${esc(up.t)}</div><div class="sub" style="margin:4px 0 0">${dfmt(up.d)} · tap for live updates</div></a>` : ''}`;
  document.getElementById('daily').onclick = async e => {
    e.target.disabled = true; e.target.textContent = 'Preparing…';
    const parts = [['quant', 3], ['reasoning', 2], ['english', 2], ['ga', 2], ['computer', 1]]; let qs = [];
    for (const [s, n] of parts) qs.push(...await pickQuestions(s, n));
    startExam({ id: 'p' + Date.now(), testId: 'daily', name: 'Daily 10 quiz', correct: 2, wrong: -0.5, lock: false, totalMinutes: 10, sections: [{ id: 'mix', name: 'Mixed', short: 'Mixed', minutes: 10, qs }] });
  };
}

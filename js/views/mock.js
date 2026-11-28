import { esc, $, toast, mmss } from '../util.js';
import { history, settings } from '../store.js';
import { config, buildPaper } from '../data.js';
import { startExam, hasActive, discardActive } from '../exam.js';

export async function render(app) {
  const cfg = await config(), h = history.list(), lock = settings.get('sectionLock');
  const card = (t, extra) => `<div class="card"><div class="row"><h3 class="sp">${esc(t.name)}</h3><span class="chip">${t.sections.reduce((a, s) => a + s.q, 0)} Q</span></div>
    <p class="sub">${esc(t.role)}</p>
    <div class="sub">${t.sections.map(s => `${esc(s.short)} ${s.q}Q·${s.minutes}m`).join(' · ')}</div>
    <div class="sub">Marking +${t.correct} / ${t.wrong} · ${t.sections.reduce((a, s) => a + s.minutes, 0)} min total</div>${extra}</div>`;
  app.innerHTML = `<h1>Full-length mocks</h1><p class="sub">Built to the CGL 2026 pattern. Questions are drawn fresh each time.</p>
  ${hasActive() ? `<div class="card" style="border-color:var(--accent)"><b>An exam is in progress</b><div class="row" style="margin-top:8px"><a class="btn sp" href="#/exam/run">Resume</a><button class="btn alt sp" id="disc">Discard</button></div></div>` : ''}
  ${card(cfg.tests.test1, '<button class="btn block" id="t1" style="margin-top:10px">Start Test-1</button>')}
  ${card(cfg.tests.test2, '<button class="btn block" id="t2" style="margin-top:10px">Start Test-2 (Paper-I)</button>')}
  <div class="card"><h3>Data entry test (Tier-II skill test)</h3><p class="sub">15-minute typing test with key-depression count and accuracy check.</p><a class="btn block" href="#/dest">Start data entry test</a></div>
  <div class="card"><div class="row"><div class="sp"><b>Strict sectional timer</b><div class="sub" style="margin:0">On = real 2026 rules: sections lock when time ends. Off = one overall timer, free movement.</div></div><button class="btn sm ${lock ? '' : 'alt'}" id="lk">${lock ? 'ON' : 'OFF'}</button></div></div>
  <h2>Past attempts</h2>
  <div class="card list">${h.length ? h.slice(0, 15).map(a => `<a class="item" href="#/result/${a.id}"><div class="row"><span class="t sp">${esc(a.name)}</span><b>${a.score}/${a.max}</b></div><div class="m">${new Date(a.ts).toLocaleDateString('en-IN')} · ${a.correct}✓ ${a.wrong}✗ · ${mmss(a.secs)}</div></a>`).join('') : '<p class="sub">No attempts yet.</p>'}</div>`;
  const go = id => async e => { e.target.disabled = true; e.target.textContent = 'Preparing paper…'; startExam(await buildPaper(id)); };
  $('#t1').onclick = go('test1'); $('#t2').onclick = go('test2');
  $('#lk').onclick = () => { settings.set({ sectionLock: !lock }); render(app); };
  const d = $('#disc'); if (d) d.onclick = () => { if (confirm('Discard the exam in progress?')) { discardActive(); render(app); } };
}

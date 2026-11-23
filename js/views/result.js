import { esc, mmss, $, $$ } from '../util.js';
import { store, history } from '../store.js';
import { config } from '../data.js';

export async function render(app, [id]) {
  const att = store.get('att:' + id, null), cfg = await config();
  if (!att) { app.innerHTML = '<div class="card"><h3>Result not found</h3><a class="btn" href="#/mock">Back</a></div>'; return; }
  const s = att.summary, items = att.items; const acc = s.correct + s.wrong ? Math.round(100 * s.correct / (s.correct + s.wrong)) : 0;
  let verdict = '';
  const cat = cfg.tests;
  if (s.testId === 'test1') { const q = cat.test1.qualifying; verdict = `Tier-I qualifying (UR): ${q.ur}/200. ${s.score >= q.ur ? '<span class="chip ok">Above UR line</span>' : '<span class="chip bad">Below UR line</span>'} <span class="sub">Cutoffs for ASO MEA run far higher than the qualifying floor.</span>`; }
  if (s.testId === 'test2') {
    const q = cat.test2.qualifying, a = s.bySec, s1 = (a.quant?.score || 0) + (a.reasoning?.score || 0), s2 = (a.english?.score || 0) + (a.ga?.score || 0), ck = a.computer?.score || 0;
    const f = (n, v, line) => `<div class="row"><span class="sp">${n}</span><b>${v}</b><span class="chip ${v >= line ? 'ok' : 'bad'}">≥ ${line}</span></div>`;
    verdict = `<h3>Test-2 merit (390) &amp; sectional floors (UR)</h3>${f('Section I (Maths+Reasoning) /180', s1, q.section1.ur)}${f('Section II (English+GA) /210', s2, q.section2.ur)}<div class="row"><span class="sp">Merit marks /390</span><b>${s1 + s2}</b></div>${f('Computer /60 (qualifying)', ck, q.computer.ur)}`;
  }
  app.innerHTML = `
  <div class="card hero"><div class="sub">${esc(s.name)} · ${new Date(s.ts).toLocaleString('en-IN')}</div><div class="row"><div class="big">${s.score}</div><div class="sp"><div>out of ${s.max}</div><div class="sub">Accuracy ${acc}% · Time ${mmss(s.secs)}</div></div></div></div>
  <div class="grid3"><div class="stat"><b style="color:var(--ok)">${s.correct}</b><span>Correct</span></div><div class="stat"><b style="color:var(--bad)">${s.wrong}</b><span>Wrong</span></div><div class="stat"><b>${s.skipped}</b><span>Skipped</span></div></div>
  ${verdict ? `<div class="card" style="margin-top:12px">${verdict}</div>` : ''}
  <h2>Section analysis</h2><div class="card">${Object.values(s.bySec).map(b => `<div style="margin-bottom:10px"><div class="row"><b class="sp">${esc(b.name)}</b><span>${r(b.score)}/${b.max}</span></div><div class="bar"><i style="width:${Math.max(0, Math.min(100, 100 * b.score / b.max))}%"></i></div><div class="sub" style="margin:2px 0 0">${b.c}✓ ${b.w}✗ ${b.s} skipped · avg ${Math.round(b.ms / 1000 / ((b.c + b.w + b.s) || 1))}s/question</div></div>`).join('')}</div>
  <h2>Review answers</h2>
  <div class="tabs" id="flt"><button class="on" data-f="all">All</button><button data-f="wrong">Wrong</button><button data-f="skip">Skipped</button><button data-f="right">Correct</button></div>
  <div id="rev"></div>
  <a class="btn block" href="#/mock" style="margin-top:8px">Take another mock</a>`;
  function r(n) { return Math.round(n * 100) / 100; }
  const show = f => {
    $('#rev').innerHTML = items.filter(i => f === 'all' || i.st === f).map((i, n) => `<div class="card"><div class="row"><span class="chip">${esc(i.topic || i.sec)}</span><span class="sp"></span><span class="sub" style="margin:0">${Math.round(i.ms / 1000)}s</span></div><div class="qtext" style="font-size:15px">${esc(i.q)}</div>${i.o.map((o, k) => `<div class="opt ${k === i.a ? 'right' : k === i.ch ? 'wrong' : ''}"><b>${'ABCD'[k]}</b><span>${esc(o)}</span></div>`).join('')}${i.e ? `<div class="expl">${esc(i.e)}</div>` : ''}</div>`).join('') || '<p class="sub">Nothing here.</p>';
  };
  show('all');
  $$('#flt button').forEach(b => b.onclick = () => { $$('#flt button').forEach(x => x.classList.remove('on')); b.classList.add('on'); show(b.dataset.f); });
}

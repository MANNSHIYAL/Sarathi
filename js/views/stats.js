import { esc } from '../util.js';
import { history } from '../store.js';
export async function statsView(app, back) {
  const h = history.list();
  const spark = (arr, max) => { if (arr.length < 2) return '<p class="sub">Take at least two tests to see a trend.</p>'; const w = 300, hh = 70, pts = arr.map((v, i) => `${(i / (arr.length - 1) * w).toFixed(1)},${(hh - Math.max(0, v) / max * hh).toFixed(1)}`).join(' '); return `<svg viewBox="0 0 ${w} ${hh + 6}" style="width:100%" role="img" aria-label="Score trend"><polyline fill="none" stroke="var(--accent)" stroke-width="2.5" points="${pts}"/></svg><div class="sub">Oldest → latest: ${arr.map(v => Math.round(v)).join(', ')}</div>`; };
  const by = id => h.filter(a => a.testId === id).slice(0, 10).reverse();
  const sec = {}; h.forEach(a => Object.values(a.bySec || {}).forEach(b => { const s = sec[b.name] ||= { c: 0, w: 0, s: 0 }; s.c += b.c; s.w += b.w; s.s += b.s; }));
  const rows = Object.entries(sec).map(([n, s]) => ({ n, acc: s.c + s.w ? Math.round(100 * s.c / (s.c + s.w)) : 0, att: s.c + s.w })).sort((a, b) => a.acc - b.acc);
  app.innerHTML = `${back}<h1>My analytics</h1>
  <div class="card"><h3>Test-1 scores (out of 200)</h3>${spark(by('test1').map(a => a.score), 200)}</div>
  <div class="card"><h3>Test-2 scores (out of 450)</h3>${spark(by('test2').map(a => a.score), 450)}</div>
  <h2>Accuracy by section</h2><div class="card">${rows.length ? rows.map(r => `<div style="margin-bottom:8px"><div class="row"><b class="sp">${esc(r.n)}</b><span>${r.acc}% · ${r.att} attempted</span></div><div class="bar"><i style="width:${r.acc}%;background:${r.acc < 60 ? 'var(--bad)' : r.acc < 80 ? 'var(--warn)' : 'var(--ok)'}"></i></div></div>`).join('') + `<div class="note">Weakest first: ${esc(rows[0].n)}. Aim for 80%+ accuracy in Test-2 because of the −1 penalty.</div>` : '<p class="sub">No data yet. Take a test.</p>'}</div>`;
}

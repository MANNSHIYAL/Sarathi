import { $, esc, mmss, toast, sheet, r2 } from './util.js';
import { store, history, memory } from './store.js';

const KEY = 'active-exam';
export function startExam(paper) {
  const S = { paper, si: 0, qi: 0, ans: {}, mark: {}, vis: {}, spent: {}, secEnd: paper.sections.map(() => null), secDone: paper.sections.map(() => false), t0: Date.now() };
  if (paper.lock) S.secEnd[0] = Date.now() + paper.sections[0].minutes * 6e4; else S.totalEnd = Date.now() + paper.totalMinutes * 6e4;
  store.set(KEY, S); location.hash = '#/exam/run';
}
export const hasActive = () => !!store.get(KEY, null);
export const discardActive = () => store.del(KEY);

export async function render(app, args) {
  let S = store.get(KEY, null);
  if (!S) { location.hash = '#/mock'; return; }
  const P = S.paper; let qStart = Date.now(), tick;
  const save = () => store.set(KEY, S);
  const sec = () => P.sections[S.si];
  const q = () => sec().qs[S.qi];
  const lap = () => { const id = q().id; S.spent[id] = (S.spent[id] || 0) + (Date.now() - qStart); qStart = Date.now(); };
  const endTs = () => P.lock ? S.secEnd[S.si] : S.totalEnd;

  function go(si, qi) { lap(); S.si = si; S.qi = qi; S.vis[q().id] = 1; if (P.lock && !S.secEnd[si]) S.secEnd[si] = Date.now() + sec().minutes * 6e4; save(); draw(); }
  function status(x) { return S.mark[x.id] ? 'rev' : S.ans[x.id] !== undefined ? 'ans' : S.vis[x.id] ? 'nA' : ''; }
  function counts(s) { let a = 0, m = 0, n = 0; s.qs.forEach(x => { if (S.ans[x.id] !== undefined) a++; else n++; if (S.mark[x.id]) m++; }); return { a, m, n }; }

  function draw() {
    S.vis[q().id] = 1; const Q = q(), s = sec();
    app.innerHTML = `
    <div class="ex-head">
      <div class="row"><div class="sp"><b>${esc(P.name)}</b><div class="sub" style="margin:0">${esc(s.short)} · Q ${S.qi + 1}/${s.qs.length}</div></div>
      <div class="timer" id="tm">--:--</div></div>
      <div class="secs">${P.sections.map((x, i) => `<span class="${i === S.si ? 'on' : ''} ${S.secDone[i] ? 'done' : ''}" data-s="${i}">${esc(x.short)}</span>`).join('')}</div>
    </div>
    <div class="row"><span class="chip">${esc(Q.topic || s.short)}</span><span class="sp"></span><span class="sub" style="margin:0">+${P.correct} / ${P.wrong}</span></div>
    <div class="qtext">${esc(Q.q)}</div>
    ${Q.o.map((o, i) => `<button class="opt ${S.ans[Q.id] === i ? 'sel' : ''}" data-o="${i}"><b>${'ABCD'[i]}</b><span>${esc(o)}</span></button>`).join('')}
    <div class="exfoot">
      <button class="btn alt" id="bPal">Palette</button>
      <button class="btn alt" id="bClr">Clear</button>
      <button class="btn alt" id="bMark">${S.mark[Q.id] ? 'Unmark' : 'Mark'}</button>
      <button class="btn" id="bNext">${S.qi === s.qs.length - 1 ? 'Finish' : 'Next'}</button>
    </div>`;
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => { S.ans[Q.id] = +b.dataset.o; save(); draw(); });
    $('#bClr').onclick = () => { delete S.ans[Q.id]; save(); draw(); };
    $('#bMark').onclick = () => { S.mark[Q.id] ? delete S.mark[Q.id] : S.mark[Q.id] = 1; save(); draw(); };
    $('#bNext').onclick = () => { if (S.qi < s.qs.length - 1) go(S.si, S.qi + 1); else askSubmit(); };
    $('#bPal').onclick = palette;
    app.querySelectorAll('.secs span').forEach(el => el.onclick = () => {
      const i = +el.dataset.s; if (i === S.si) return;
      if (P.lock) { toast('Sections are time-locked, like the real exam'); return; } go(i, 0);
    });
    updateTimer();
  }

  function palette() {
    const s = sec();
    sheet(`<h3>${esc(s.name)}</h3>
      <div class="legend"><span><i style="background:var(--ok)"></i>Answered</span><span><i style="background:var(--bad)"></i>Not answered</span><span><i style="background:#7c3aed"></i>Marked</span><span><i style="border:1px solid var(--line)"></i>Not visited</span></div>
      <div class="pal">${s.qs.map((x, i) => `<button class="${status(x)} ${i === S.qi ? 'cur' : ''}" data-i="${i}">${i + 1}</button>`).join('')}</div>
      <div class="row" style="margin-top:14px"><button class="btn alt sp" data-close>Back</button><button class="btn bad sp" data-sub>Submit ${P.lock ? 'section' : 'test'}</button></div>`,
      (el, close) => {
        el.querySelectorAll('.pal button').forEach(b => b.onclick = () => { close(); go(S.si, +b.dataset.i); });
        el.querySelector('[data-close]').onclick = close; el.querySelector('[data-sub]').onclick = () => { close(); askSubmit(); };
      });
  }

  function askSubmit() {
    const last = S.si === P.sections.length - 1 || !P.lock, c = counts(P.lock ? sec() : { qs: P.sections.flatMap(x => x.qs) });
    sheet(`<h3>${P.lock && !last ? 'Submit this section?' : 'Submit the test?'}</h3>
      <div class="grid3"><div class="stat"><b>${c.a}</b><span>Answered</span></div><div class="stat"><b>${c.n}</b><span>Not answered</span></div><div class="stat"><b>${c.m}</b><span>Marked</span></div></div>
      ${P.lock && !last ? '<p class="note">You cannot come back to this section. Unused time is lost, as in the real exam.</p>' : ''}
      <div class="row" style="margin-top:12px"><button class="btn alt sp" data-no>Keep going</button><button class="btn ok sp" data-yes>Yes, submit</button></div>`,
      (el, close) => { el.querySelector('[data-no]').onclick = close; el.querySelector('[data-yes]').onclick = () => { close(); nextSection(); }; });
  }

  function nextSection() {
    lap(); S.secDone[S.si] = true;
    if (!P.lock || S.si === P.sections.length - 1) return finish();
    S.si++; S.qi = 0; S.secEnd[S.si] = Date.now() + sec().minutes * 6e4; save(); toast('Next section: ' + sec().short); draw();
  }

  function updateTimer() {
    const rem = (endTs() - Date.now()) / 1000, el = $('#tm'); if (!el) return;
    el.textContent = mmss(rem); el.classList.toggle('low', rem < 60);
    if (rem <= 0) { toast('Time up'); nextSection(); }
  }

  function finish() {
    clearInterval(tick); lap();
    const attempt = evaluate(S); store.del(KEY); location.hash = '#/result/' + attempt.id;
  }

  S.vis[q().id] = 1;
  // if section expired while the app was closed, move on
  while (P.lock && S.secEnd[S.si] && Date.now() > S.secEnd[S.si] && !S.finishing) {
    S.secDone[S.si] = true; if (S.si === P.sections.length - 1) { S.finishing = 1; break; } S.si++; S.qi = 0; S.secEnd[S.si] = Date.now() + sec().minutes * 6e4;
  }
  if (S.finishing) { evaluateAndGo(); return; }
  function evaluateAndGo() { const a = evaluate(S); store.del(KEY); location.hash = '#/result/' + a.id; }
  draw(); tick = setInterval(updateTimer, 500);
  const guard = e => { e.preventDefault(); e.returnValue = ''; }; addEventListener('beforeunload', guard);
  return () => { clearInterval(tick); removeEventListener('beforeunload', guard); };
}

export function evaluate(S) {
  const P = S.paper, id = 'a' + Date.now().toString(36); let score = 0, correct = 0, wrong = 0, skipped = 0, max = 0;
  const bySec = {}, items = [], wb = store.get('wrongbook', []);
  for (const s of P.sections) {
    const b = bySec[s.id] = { name: s.short, c: 0, w: 0, s: 0, score: 0, max: s.qs.length * P.correct, ms: 0 }; max += b.max;
    for (const x of s.qs) {
      const ch = S.ans[x.id]; let st = 'skip';
      if (ch === undefined) { b.s++; skipped++; } else if (ch === x.a) { b.c++; correct++; st = 'right'; b.score += P.correct; score += P.correct; } else { b.w++; wrong++; st = 'wrong'; b.score += P.wrong; score += P.wrong; }
      b.ms += S.spent[x.id] || 0;
      items.push({ id: x.id, sec: s.id, topic: x.topic, q: x.q, o: x.o, a: x.a, e: x.e, ch, st, ms: S.spent[x.id] || 0 });
      if (st === 'wrong' && !wb.some(w => w.q === x.q)) wb.unshift({ id: x.id, s: s.id, t: x.topic, q: x.q, o: x.o, a: x.a, e: x.e });
    }
  }
  store.set('wrongbook', wb.slice(0, 300));
  memory.record(items.filter(i => !String(i.id).startsWith('g-')).map(i => ({ id: i.id, status: i.st === 'wrong' ? 'wrong' : i.st })));
  const summary = { id, ts: Date.now(), testId: P.testId, name: P.name, score: r2(score), max, correct, wrong, skipped, bySec, secs: Math.round((Date.now() - S.t0) / 1000) };
  history.add(summary);
  const keep = store.get('att-ids', []); keep.unshift(id); store.set('att-ids', keep.slice(0, 8)); keep.slice(8).forEach(k => store.del('att:' + k));
  store.set('att:' + id, { summary, items });
  return summary;
}

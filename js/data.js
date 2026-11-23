import { getJSON, shuffle } from './util.js';
import { store, settings, memory } from './store.js';
import { genQuestions, genTopics } from './gen.js';
export { genTopics };
let _cfg, _bank;
export async function config() { return _cfg ||= await getJSON('data/exam-config.json'); }
export async function bank() {
  if (_bank) return _bank;
  let base = []; try { base = (await getJSON('data/qbank.json')).questions; } catch { }
  let ota = []; const cb = settings.get('contentBase');
  if (cb) { try { ota = (await getJSON(cb.replace(/\/$/, '') + '/qbank.json', { cache: 'no-cache' })).questions || []; store.set('ota-bank', ota); } catch { ota = store.get('ota-bank', []); } }
  const ai = store.get('ai-bank', []);
  const seen = new Set(); _bank = [...base, ...ota, ...ai].filter(q => q && q.q && Array.isArray(q.o) && q.o.length === 4 && !seen.has(q.id) && seen.add(q.id));
  return _bank;
}
export function resetBank() { _bank = null; }
// Shuffle options, keep the right answer tracked.
function prep(q, sec) {
  const idx = shuffle([0, 1, 2, 3]); return { id: q.id, sec, topic: q.t || '', q: q.q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a), e: q.e || '' };
}
export async function pickQuestions(sec, n, opts = {}) {
  const b = (await bank()).filter(q => q.s === sec && (!opts.topic || q.t === opts.topic));
  const mem = memory.all();
  const rank = q => (mem[q.id]?.seen || 0) + Math.random();
  const fromBank = b.slice().sort((x, y) => rank(x) - rank(y));
  const gens = sec === 'quant' || sec === 'reasoning';
  const out = [];
  if (gens) out.push(...genQuestions(sec, opts.topic ? n : Math.round(n * 0.75), opts.topic));
  for (const q of fromBank) { if (out.length >= n) break; out.push(q); }
  if (gens && out.length < n) out.push(...genQuestions(sec, n - out.length, opts.topic));
  return shuffle(out).slice(0, n).map(q => prep(q, sec));
}
export async function buildPaper(testId) {
  const c = (await config()).tests[testId];
  const sections = [];
  for (const s of c.sections) sections.push({ id: s.id, name: s.name, short: s.short, minutes: s.minutes, qs: await pickQuestions(s.id, s.q) });
  return { id: 'p' + Date.now().toString(36), testId, name: c.name, correct: c.correct, wrong: c.wrong, sections, lock: settings.get('sectionLock'), totalMinutes: c.sections.reduce((a, s) => a + s.minutes, 0) };
}
export async function customPaper(secId, n, minutes, opts = {}) {
  const c = await config(); const sec = c.tests.test2.sections.find(s => s.id === secId) || c.tests.test1.sections.find(s => s.id === secId);
  const qs = opts.qs || await pickQuestions(secId, n, opts);
  return { id: 'p' + Date.now().toString(36), testId: opts.testId || 'sectional', name: opts.name || (sec.short + ' practice'), correct: opts.correct ?? 2, wrong: opts.wrong ?? -0.5, lock: false, totalMinutes: minutes, sections: [{ id: secId, name: sec.name, short: sec.short, minutes, qs }] };
}

import { esc, $, $$, toast, dfmt, today, getJSON } from '../util.js';
import { store, settings, history } from '../store.js';
import { config } from '../data.js';
import { aiJSON } from '../ai.js';
import { notesView } from './notes.js';
import { statsView } from './stats.js';
import { render as weekView } from './week.js';
import { loadBooks, bookLinks } from '../books.js';

export async function buildPlan() {
  const P = await getJSON('data/plan.json'), st = settings.all();
  let start = st.planStart || store.get('plan-start', null); if (!start) { start = today(); store.set('plan-start', start); }
  const total = Math.max(8, Math.ceil((new Date(st.tier1Date) - new Date(start)) / (7 * 864e5)));
  const weeks = []; let left = total;
  P.phases.forEach((ph, pi) => { const n = pi === P.phases.length - 1 ? left : Math.round(ph.share * total); left -= n; for (let i = 0; i < n; i++) weeks.push({ key: `${ph.id}-w${(i % ph.weeks.length) + 1}`, phase: ph.name, goal: ph.goal, w: ph.weeks[i % ph.weeks.length], cycle: i >= ph.weeks.length }); });
  return { P, weeks: weeks.slice(0, total), start, total };
}
export async function currentWeek() {
  try { const { weeks, start, total } = await buildPlan(); const n = Math.floor((Date.now() - new Date(start + 'T00:00:00')) / (7 * 864e5)) + 1; const w = weeks[Math.min(Math.max(n, 1), weeks.length) - 1]; return w ? { n: Math.min(Math.max(n, 1), weeks.length), total, ...w } : null; } catch { return null; }
}
const MENU = [['plan', 'Study plan', 'Weekly plan to your Test-1 date'], ['aso', 'ASO MEA track', 'Post facts, target calculator, IR reading'], ['notes', 'Notes & flashcards', 'Formulas, diplomacy terms, vocabulary'], ['stats', 'My analytics', 'Score trend and weak sections'], ['settings', 'Settings', 'Dates, AI key, backup'], ['sources', 'Exam facts & sources', 'What this app is based on']];

export async function render(app, args) {
  const [sub] = args;
  if (!sub) { app.innerHTML = `<h1>More</h1><div class="card list">${MENU.map(m => `<a class="item" href="#/more/${m[0]}"><div class="t">${m[1]}</div><div class="m">${m[2]}</div></a>`).join('')}</div>`; return; }
  const back = `<a href="#/more" class="sub" style="text-decoration:none">← More</a>`;
  if (sub === 'plan') return plan(app, back);
  if (sub === 'week') return weekView(app, args);
  if (sub === 'aso') return aso(app, back);
  if (sub === 'notes') return notesView(app, back);
  if (sub === 'stats') return statsView(app, back);
  if (sub === 'settings') return settingsView(app, back);
  if (sub === 'sources') return sources(app, back);
}

async function plan(app, back) {
  await loadBooks();
  const { P, weeks, start, total } = await buildPlan(), done = store.get('plan-done', {}), cur = Math.floor((Date.now() - new Date(start + 'T00:00:00')) / (7 * 864e5)) + 1;
  const nd = Object.keys(done).length;
  app.innerHTML = `${back}<h1>Study plan</h1><p class="sub">${total} weeks from ${dfmt(start)} to your estimated Test-1 date. Tap a week to expand.</p>
  <div class="card"><div class="row"><b class="sp">${nd}/${total} weeks done</b></div><div class="bar" style="margin-top:6px"><i style="width:${100 * nd / total}%"></i></div></div>
  <details class="card"><summary style="cursor:pointer"><b>Core books for the whole plan</b></summary>${(P.books || []).map(b => `<div style="margin-top:8px"><b>${esc(b[0])}</b><div class="sub" style="margin:0">${esc(b[1])}</div>${bookLinks(b[1])}</div>`).join('')}<div class="note">${esc(P.booksNote || '')}</div></details>
  <div class="card"><h3>Every day</h3>${P.daily.map(d => `<div class="row" style="padding:3px 0"><b style="width:120px">${esc(d[0])}</b><span class="sp sub" style="margin:0">${esc(d[2])}</span><span class="chip">${esc(d[1])}</span></div>`).join('')}</div>
  ${weeks.map((w, i) => `${i === 0 || weeks[i - 1].phase !== w.phase ? `<h2>${esc(w.phase)}</h2><p class="sub">${esc(w.goal)}</p>` : ''}
  <details class="card" ${i + 1 === cur ? 'open' : ''}><summary style="cursor:pointer"><b>Week ${i + 1}</b> ${w.cycle ? '<span class="chip warn">Revision cycle</span>' : ''} ${i + 1 === cur ? '<span class="chip">Now</span>' : ''} ${done[i] ? '<span class="chip ok">Done</span>' : ''}</summary>
  <div class="sub" style="margin-top:8px">${[['q', 'Quant'], ['r', 'Reasoning'], ['e', 'English'], ['g', 'GA']].map(([k, n]) => `<b>${n}:</b> ${esc(w.w[k])}${(w.w.ref?.[k] || []).map(x => `<div style="margin:2px 0 6px 10px">📖 ${esc(x)}${bookLinks(x)}</div>`).join('')}`).join('<br>')}</div><a class="btn sm" href="#/more/week/${i + 1}" style="margin-right:6px">Open full lesson →</a><button class="btn alt sm" data-w="${i}">${done[i] ? 'Mark not done' : 'Mark week done'}</button></details>`).join('')}
  <h2>Free official resources</h2><div class="card list">${P.resources.map(r => `<a class="item" href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])} ↗</a>`).join('')}</div>`;
  $$('[data-w]').forEach(b => b.onclick = e => { e.preventDefault(); const d = store.get('plan-done', {}); d[b.dataset.w] ? delete d[b.dataset.w] : d[b.dataset.w] = 1; store.set('plan-done', d); plan(app, back); });
}

async function aso(app, back) {
  const c = await config(), a = c.asoMea, T = c.tests.test2;
  app.innerHTML = `${back}<h1>ASO MEA track</h1><p class="sub">${esc(a.post)}</p>
  <div class="card list"><div class="item"><div class="m">Pay</div><div class="t">${esc(a.payLevel)}</div></div><div class="item"><div class="m">Age</div><div class="t">${esc(a.age)}</div></div><div class="item"><div class="m">Education</div><div class="t">${esc(a.education)}</div></div><div class="item"><div class="m">Posting</div><div class="t">${esc(a.posting)}</div></div><div class="item"><div class="m">Selection</div><div class="t">${esc(a.selectionNote)}</div></div></div>
  <div class="note">Past cutoff (UR, ${a.pastCutoff.year}): about ${a.pastCutoff.ur}. ${esc(a.pastCutoff.caution)}</div>
  <h2>Marks calculator (Test-2 merit, 390)</h2>
  <div class="card"><p class="sub">Test-2 gives +3 per right and −1 per wrong, so marks = attempts × (4 × accuracy − 1). Pick a target and see the accuracy you need.</p>
  <label>Target marks (out of 390)</label><input id="tg" type="number" value="330" min="0" max="390">
  <label>Questions you attempt (out of 130)</label><input id="at" type="number" value="115" min="1" max="130">
  <div id="out" class="card" style="margin-top:10px"></div></div>
  <h2>Where the marks are</h2><div class="card">${T.sections.filter(s => !s.qualifyingOnly).map(s => `<div class="row" style="padding:3px 0"><span class="sp">${esc(s.short)}</span><span>${s.q} Q</span><b>${s.q * 3} marks</b></div>`).join('')}<div class="note">English + GA is 70 of 130 scored questions (210 of 390 marks). For ASO MEA, language and diplomacy-linked awareness are the most efficient place to gain marks.</div></div>
  <h2>Strategy</h2><div class="card"><div class="sub" style="line-height:1.7">• Test-2 rewards accuracy: a blind guess among 4 options is worth 0 on average (+3 or −1), but if you can rule out even one option, guessing pays. In Test-1 (+2 / −0.5) a blind guess is slightly positive.<br>• Clear every sectional floor (UR: Section I ≥ 54, Section II ≥ 63, Computer ≥ 18).<br>• Put ASO MEA first in your post preferences if it is your goal; preferences are final.<br>• Read MEA's weekly briefings and bilateral relations pages for GA; they are also useful in interviews for the Ministry.<br>• Practise the Computer test: it is qualifying, so 20 easy questions can end your attempt if skipped.</div></div>
  <h2>IR and MEA reading</h2><div class="card list"><a class="item" href="https://www.mea.gov.in" target="_blank" rel="noopener">MEA website: bilateral relations, press briefings ↗</a><a class="item" href="https://www.mea.gov.in/annual-reports.htm" target="_blank" rel="noopener">MEA Annual Report ↗</a><a class="item" href="https://pib.gov.in" target="_blank" rel="noopener">PIB: Ministry of External Affairs releases ↗</a><a class="item" href="#/more/notes">Diplomacy glossary and flashcards</a></div>`;
  const calc = () => { const t = +$('#tg').value, n = +$('#at').value; const acc = (t / n + 1) / 4; const ok = acc <= 1 && n > 0; $('#out').innerHTML = ok ? `<div class="big" style="font-size:30px">${Math.ceil(acc * 100)}%</div><div class="sub" style="margin:4px 0 0">accuracy needed on ${n} attempts: about ${Math.ceil(acc * n)} right, ${n - Math.ceil(acc * n)} wrong.</div>` : '<div class="sub">Not reachable with that many attempts.</div>'; };
  $('#tg').oninput = calc; $('#at').oninput = calc; calc();
}

async function settingsView(app, back) {
  const s = settings.all();
  app.innerHTML = `${back}<h1>Settings</h1>
  <div class="card"><h3>Exam dates (estimates)</h3><label>Test-1 (Tier-I) date</label><input type="date" id="d1" value="${esc(s.tier1Date)}"><label>Test-2 (Tier-II) date</label><input type="date" id="d2" value="${esc(s.tier2Date)}"><label>Plan start date</label><input type="date" id="ps" value="${esc(s.planStart || store.get('plan-start', today()))}"><button class="btn block" id="sv1" style="margin-top:12px">Save dates</button></div>
  <div class="card"><h3>AI (optional)</h3><p class="sub">Unlocks endless new questions and quizzes from live headlines. Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>. The key stays on this phone and is sent only to Google.</p>
  <label>Gemini API key</label><input type="password" id="gk" value="${esc(s.geminiKey)}" autocomplete="off"><label>Model</label><input id="gm" value="${esc(s.geminiModel)}"><div class="row" style="margin-top:10px"><button class="btn sp" id="sv2">Save</button><button class="btn alt sp" id="tst">Test</button></div></div>
  <div class="card"><h3>Live content server (optional)</h3><p class="sub">If you host this app on GitHub Pages with the included workflow, current affairs refresh every 3 hours server-side. Leave blank to use the same site.</p><input id="cb" placeholder="https://you.github.io/sarthi/data" value="${esc(s.contentBase)}"><button class="btn alt block" id="sv3" style="margin-top:10px">Save</button></div>
  <div class="card"><h3>Backup</h3><div class="row"><button class="btn alt sp" id="ex">Export progress</button><button class="btn alt sp" id="im">Import</button></div><input type="file" id="fi" accept=".json" hidden><button class="btn bad block" id="rs" style="margin-top:10px">Erase all my data</button></div>`;
  $('#sv1').onclick = () => { settings.set({ tier1Date: $('#d1').value, tier2Date: $('#d2').value, planStart: $('#ps').value }); toast('Saved'); };
  $('#sv2').onclick = () => { settings.set({ geminiKey: $('#gk').value.trim(), geminiModel: $('#gm').value.trim() || 'gemini-2.5-flash' }); toast('Saved'); };
  $('#sv3').onclick = () => { settings.set({ contentBase: $('#cb').value.trim() }); toast('Saved'); };
  $('#tst').onclick = async () => { settings.set({ geminiKey: $('#gk').value.trim(), geminiModel: $('#gm').value.trim() || 'gemini-2.5-flash' }); try { await aiJSON('Return exactly {"ok":true}'); toast('AI connected ✓'); } catch (e) { toast(e.message, 4500); } };
  $('#ex').onclick = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('sarthi:') && k !== 'sarthi:settings') o[k] = localStorage.getItem(k); } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: 'application/json' })); a.download = 'sarthi-backup-' + today() + '.json'; a.click(); };
  $('#im').onclick = () => $('#fi').click();
  $('#fi').onchange = async e => { try { const o = JSON.parse(await e.target.files[0].text()); Object.entries(o).forEach(([k, v]) => k.startsWith('sarthi:') && localStorage.setItem(k, v)); toast('Imported'); } catch { toast('Not a valid backup'); } };
  $('#rs').onclick = () => { if (confirm('Erase all attempts, notes and settings on this device?')) { Object.keys(localStorage).filter(k => k.startsWith('sarthi:')).forEach(k => localStorage.removeItem(k)); toast('Erased'); location.hash = '#/home'; } };
}

async function sources(app, back) {
  const c = await config();
  app.innerHTML = `${back}<h1>Exam facts &amp; sources</h1><p class="sub">Checked ${esc(c.asOf)}. The app follows the CGL 2026 notice pattern, since CGL 2027 is not out yet. SSC can change the pattern: always verify on ssc.gov.in.</p>
  <div class="card list">${c.sources.map(s => `<a class="item" href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])} ↗</a>`).join('')}</div>
  <h2>Timeline</h2><div class="card"><p class="sub"><b>CGL 2026:</b> ${esc(c.timeline.cgl2026)}</p><p class="sub"><b>CGL 2027:</b> ${esc(c.timeline.cgl2027)}</p></div>
  <h2>Not covered</h2><div class="card"><p class="sub">${esc(c.otherPapers)} Hindi medium and a Data Entry Speed Test are not simulated. The real Tier-I is bilingual.</p></div>`;
}

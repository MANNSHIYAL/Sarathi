import { esc, $, $$, toast, dfmt } from '../util.js';
import { store } from '../store.js';
import { FEEDS, loadFeed, examUpdates, ago } from '../ca.js';
import { aiReady, aiQuestions } from '../ai.js';
import { customPaper } from '../data.js';
import { startExam } from '../exam.js';

export async function render(app) {
  let cur = store.get('news-tab', 'ssc');
  const saved = () => store.get('saved-news', []);
  app.innerHTML = `<div class="row"><h1 class="sp">Live updates</h1><button class="btn alt sm" id="rf">Refresh</button></div><p class="sub">Exam notices and current affairs, fetched live when you are online.</p>
  <div id="eu"></div><div class="tabs" id="tb">${FEEDS.map(f => `<button data-f="${f.id}" class="${f.id === cur ? 'on' : ''}">${f.name}</button>`).join('')}<button data-f="__saved" class="${cur === '__saved' ? 'on' : ''}">Saved</button></div><div id="st" class="sub"></div><div class="card list" id="lst"></div><div id="qz"></div>`;
  examUpdates().then(u => { $('#eu').innerHTML = `<div class="card"><h3>SSC CGL: verified updates</h3><div class="list">${(u.updates || []).map(x => `<a class="item" href="${esc(x.link)}" target="_blank" rel="noopener"><div class="t">${esc(x.t)}</div><div class="m">${dfmt(x.d)} · ${esc(x.src)}</div></a>`).join('')}</div><div class="note">Confirm everything on <a href="https://ssc.gov.in" target="_blank" rel="noopener">ssc.gov.in</a>.</div></div>`; });
  let items = [];
  const list = () => {
    const sv = saved(), svSet = new Set(sv.map(x => x.link));
    $('#lst').innerHTML = items.length ? items.map((i, n) => `<div class="item"><a href="${esc(i.link)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><div class="t">${esc(i.t)}</div></a><div class="row"><span class="m sp">${esc(i.src)} ${i.ts ? '· ' + ago(i.ts) : ''}</span><button class="btn ghost sm" data-sv="${n}">${svSet.has(i.link) ? '★' : '☆'}</button></div></div>`).join('') : '<p class="sub">Nothing to show yet.</p>';
    $$('[data-sv]').forEach(b => b.onclick = () => { const i = items[+b.dataset.sv]; let s = saved(); s = s.some(x => x.link === i.link) ? s.filter(x => x.link !== i.link) : [i, ...s]; store.set('saved-news', s.slice(0, 100)); if (cur === '__saved') items = s; list(); });
    $('#qz').innerHTML = items.length && cur !== '__saved' ? `<button class="btn block" id="quiz" ${aiReady() ? '' : 'disabled'}>${aiReady() ? 'Quiz me on these headlines (AI)' : 'Add a Gemini key in Settings to get a quiz from these headlines'}</button>` : '';
    const q = $('#quiz'); if (q) q.onclick = async () => { q.disabled = true; q.textContent = 'Writing questions…'; try { const qs = await aiQuestions({ sec: 'ga', topic: 'Current Affairs', n: 10, context: items.slice(0, 15).map(i => '- ' + i.t).join('\n') }); startExam(await customPaper('ga', 0, 8, { qs: qs.map(x => ({ id: x.id, sec: 'ga', topic: 'Current Affairs', q: x.q, o: x.o, a: x.a, e: x.e })), name: 'Current affairs quiz' })); } catch (e) { toast(e.message, 4000); q.disabled = false; q.textContent = 'Try again'; } };
  };
  async function load(force) {
    if (cur === '__saved') { items = saved(); $('#st').textContent = items.length + ' saved'; return list(); }
    $('#st').textContent = 'Fetching…'; items = []; list();
    try { const r = await loadFeed(cur, force); items = r.items; $('#st').textContent = r.live ? `Live · updated ${ago(r.at)}${r.via ? ' via ' + r.via : ''}` : r.snapshot ? 'Offline: no live data reachable and nothing cached yet.' : `Offline copy from ${ago(r.at)}`; } catch (e) { $('#st').textContent = 'Could not load: ' + e.message; }
    list();
  }
  $$('#tb button').forEach(b => b.onclick = () => { cur = b.dataset.f; store.set('news-tab', cur); $$('#tb button').forEach(x => x.classList.toggle('on', x === b)); load(false); });
  $('#rf').onclick = () => load(true);
  load(false);
}

import { esc, $, $$, toast, dfmt } from '../util.js';
import { store } from '../store.js';
import { FEEDS, loadFeed, examUpdates, ago, summariseItem, isGN } from '../ca.js';
import { aiReady, aiQuestions, aiJSON } from '../ai.js';
import { customPaper } from '../data.js';
import { startExam } from '../exam.js';

export async function render(app) {
  let cur = store.get('news-tab', 'ssc');
  const saved = () => store.get('saved-news', []);
  app.innerHTML = `<div class="row"><h1 class="sp">Live updates</h1><button class="btn alt sm" id="dgb">Section digest</button><button class="btn alt sm" id="rf" style="margin-left:6px">Refresh</button></div><p class="sub">Exam notices and current affairs, fetched live when you are online.</p>
  <div id="eu"></div><div class="tabs" id="tb">${FEEDS.map(f => `<button data-f="${f.id}" class="${f.id === cur ? 'on' : ''}">${f.name}</button>`).join('')}<button data-f="__saved" class="${cur === '__saved' ? 'on' : ''}">Saved</button></div><div id="st" class="sub"></div><div id="dg"></div><div class="card list" id="lst"></div><div id="qz"></div>`;
  examUpdates().then(u => { $('#eu').innerHTML = `<div class="card"><h3>SSC CGL: verified updates</h3><div class="list">${(u.updates || []).map(x => `<a class="item" href="${esc(x.link)}" target="_blank" rel="noopener"><div class="t">${esc(x.t)}</div><div class="m">${dfmt(x.d)} · ${esc(x.src)}</div></a>`).join('')}</div><div class="note">Confirm everything on <a href="https://ssc.gov.in" target="_blank" rel="noopener">ssc.gov.in</a>.</div></div>`; });
  let items = [];
  const list = () => {
    const sv = saved(), svSet = new Set(sv.map(x => x.link));
    $('#lst').innerHTML = items.length ? items.map((i, n) => `<div class="item news"><a href="${esc(i.link)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><div class="t">${esc(i.t)}</div></a><div class="m">${esc(i.src)} ${i.ts ? '· ' + ago(i.ts) : ''}${i.ai ? ' · AI summary' : ''}</div>
      ${i.sum ? `<p class="sm">${esc(i.sum)}</p>` : isGN(i.link) ? '<p class="sub" style="margin:6px 0">Headline only. Open the source for details.</p>' : `<button class="btn alt sm" data-sm="${n}" style="margin:6px 0">Summarise</button>`}
      ${i.pts?.length ? `<details><summary class="sub" style="cursor:pointer;margin:2px 0">Key points (${i.pts.length})</summary><ul class="kp">${i.pts.map(p => `<li>${esc(p)}</li>`).join('')}</ul></details>` : ''}
      ${i.ssc ? `<div class="note">For the exam: ${esc(i.ssc)}</div>` : ''}
      <div class="row" style="margin-top:4px"><a class="btn alt sm" href="${esc(i.link)}" target="_blank" rel="noopener">Read source ↗</a><span class="sp"></span><button class="btn ghost sm" data-sv="${n}">${svSet.has(i.link) ? '★ Saved' : '☆ Save'}</button></div></div>`).join('') : '<p class="sub">Nothing to show yet.</p>';
    $$('[data-sm]').forEach(b => b.onclick = async () => { const i = items[+b.dataset.sm]; b.disabled = true; b.textContent = 'Reading…'; try { Object.assign(i, await summariseItem(i)); list(); } catch (e) { b.disabled = false; b.textContent = 'Summarise'; toast(e.message, 4500); } });
    $$('[data-sv]').forEach(b => b.onclick = () => { const i = items[+b.dataset.sv]; let s = saved(); s = s.some(x => x.link === i.link) ? s.filter(x => x.link !== i.link) : [i, ...s]; store.set('saved-news', s.slice(0, 100)); if (cur === '__saved') items = s; list(); });
    $('#qz').innerHTML = items.length && cur !== '__saved' ? `<button class="btn block" id="quiz" ${aiReady() ? '' : 'disabled'}>${aiReady() ? 'Quiz me on these headlines (AI)' : 'Add a Gemini key in Settings to get a quiz from these headlines'}</button>` : '';
    const q = $('#quiz'); if (q) q.onclick = async () => { q.disabled = true; q.textContent = 'Writing questions…'; try { const qs = await aiQuestions({ sec: 'ga', topic: 'Current Affairs', n: 10, context: items.slice(0, 15).map(i => '- ' + i.t + (i.sum ? ': ' + i.sum : '')).join('\n') }); startExam(await customPaper('ga', 0, 8, { qs: qs.map(x => ({ id: x.id, sec: 'ga', topic: 'Current Affairs', q: x.q, o: x.o, a: x.a, e: x.e })), name: 'Current affairs quiz' })); } catch (e) { toast(e.message, 4000); q.disabled = false; q.textContent = 'Try again'; } };
  };
  const first = t => (t.match(/^.{30,}?[.!?](?=\s|$)/) || [t.slice(0, 160)])[0];
  async function digest() {
    const rows = items.filter(i => i.sum).slice(0, 12); if (!rows.length) return toast('No summaries to digest yet. Refresh first.');
    const b = $('#dgb'); b.disabled = true; b.textContent = 'Preparing…'; const key = 'digest:' + cur + ':' + new Date().toISOString().slice(0, 10) + ':' + rows.length + ':' + aiReady();
    let d = store.get(key, null);
    if (!d) {
      d = { pts: rows.map(i => `${i.t}: ${first(i.sum)}`), ai: 0 };
      if (aiReady()) { try { const o = await aiJSON(`You write a daily revision digest for an SSC CGL aspirant. Use ONLY the items below, invent nothing. Merge related items. Return JSON {"pts":["6-8 one-sentence bullet points with names, numbers, dates"],"remember":["3-5 short exam-style facts to memorise"]}\n` + rows.map(i => '- ' + i.t + '. ' + i.sum).join('\n')); if (Array.isArray(o.pts) && o.pts.length) d = { pts: o.pts.map(String), remember: (o.remember || []).map(String), ai: 1 }; } catch (e) { toast('AI digest failed, showing quick digest', 3000); } }
      store.set(key, d);
    }
    $('#dg').innerHTML = `<div class="card"><div class="row"><h3 class="sp">Section digest ${d.ai ? '<span class="chip">AI</span>' : ''}</h3><button class="btn ghost sm" id="dgx">Hide</button></div><ul class="kp">${d.pts.map(p => `<li>${esc(p)}</li>`).join('')}</ul>${d.remember?.length ? `<div class="note"><b>Remember:</b><ul class="kp">${d.remember.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}</div>`;
    $('#dgx').onclick = () => { $('#dg').innerHTML = ''; }; b.disabled = false; b.textContent = 'Section digest';
  }
  async function load(force) {
    if (cur === '__saved') { items = saved(); $('#st').textContent = items.length + ' saved'; return list(); }
    $('#st').textContent = 'Fetching…'; items = []; $('#dg').innerHTML = ''; list();
    try { const r = await loadFeed(cur, force); items = r.items; $('#st').textContent = r.live ? `Live · updated ${ago(r.at)}${r.via ? ' via ' + r.via : ''}` : r.snapshot ? 'Offline: no live data reachable and nothing cached yet.' : `Offline copy from ${ago(r.at)}`; } catch (e) { $('#st').textContent = 'Could not load: ' + e.message; }
    list();
  }
  $$('#tb button').forEach(b => b.onclick = () => { cur = b.dataset.f; store.set('news-tab', cur); $$('#tb button').forEach(x => x.classList.toggle('on', x === b)); load(false); });
  $('#rf').onclick = () => load(true);
  $('#dgb').onclick = digest;
  load(false);
}

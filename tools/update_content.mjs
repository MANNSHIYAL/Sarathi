// Server-side refresh -> data/ca.json with a summary and key points for every item.
// Run by GitHub Actions (see .github/workflows/refresh.yml). Node 18+, no dependencies.
// Optional secret GEMINI_API_KEY gives better AI summaries; without it, an extractive summary is used.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { FEEDS, isGN } from '../js/feeds.js';
import { stripTags, htmlToParas, summarize, aiPrompt } from '../js/summarize.js';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const KEY = process.env.GEMINI_API_KEY || '', MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PER_FEED = 30, ENRICH = 20;
const dec = s => stripTags(s);
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`, 'i')); return m ? m[1] : ''; };
export function parse(xml) {
  const ch = dec(tag(xml, 'title'));
  return [...xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/g)].map(m => {
    const x = m[0]; let t = dec(tag(x, 'title')), src = dec(tag(x, 'source')); const mm = t.match(/ - ([^-]{2,40})$/); if (mm && (!src || src === mm[1])) { src = mm[1]; t = t.slice(0, -mm[0].length); }
    let link = dec(tag(x, 'link')) || (x.match(/<link[^>]*href="([^"]+)"/) || [])[1] || '';
    const d = dec(tag(x, 'description') || tag(x, 'summary') || tag(x, 'content:encoded')).replace(/\s*(?:Read more|Continue reading).*$/i, '');
    return { t, link, ts: Date.parse(dec(tag(x, 'pubDate') || tag(x, 'updated') || tag(x, 'published'))) || 0, src: src || ch.replace(/ - .*/, ''), d: d.length > 60 && !isGN(link) ? d.slice(0, 500) : '' };
  }).filter(i => i.t && /^https?:/.test(i.link));
}
async function get(u, ms = 20000) { const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xml,*/*' }, signal: AbortSignal.timeout(ms), redirect: 'follow' }); if (!r.ok) throw new Error(r.status); return r.text(); }
async function ai(title, text) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: aiPrompt(title, text) }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }), signal: AbortSignal.timeout(40000) });
  if (!r.ok) throw new Error('gemini ' + r.status); const j = await r.json(); const o = JSON.parse(j.candidates[0].content.parts.map(p => p.text).join(''));
  if (!o.sum || !Array.isArray(o.pts)) throw new Error('bad ai json'); return { sum: String(o.sum).slice(0, 600), pts: o.pts.slice(0, 5).map(String), ssc: o.ssc ? String(o.ssc).slice(0, 200) : undefined, ai: 1 };
}
async function enrich(item) {
  if (isGN(item.link)) return;
  let paras = []; try { paras = htmlToParas(await get(item.link, 15000)); } catch { }
  const text = paras.join(' ');
  if (text.length < 300 && item.d) paras = [item.d]; // short pages: use the feed's own description
  if (!paras.length) return;
  if (KEY) { try { Object.assign(item, await ai(item.t, paras.join(' '))); await new Promise(r => setTimeout(r, 4500)); return; } catch (e) { console.error('ai fail', e.message); } }
  const s = summarize(paras); if (s) Object.assign(item, s);
}
async function pool(list, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) { const it = list[i++]; try { await fn(it); } catch (e) { console.error('enrich fail', it.link, e.message); } } })); }
if (process.argv[1] && process.argv[1].endsWith('update_content.mjs')) {
  const old = existsSync('data/ca.json') ? JSON.parse(readFileSync('data/ca.json', 'utf8')) : { feeds: {} };
  const prev = new Map(Object.values(old.feeds || {}).flat().filter(i => i.sum).map(i => [i.link, i]));
  const out = { generated: new Date().toISOString(), feeds: {} };
  for (const f of FEEDS) {
    let items = [];
    await Promise.all(f.urls.map(async u => { try { items.push(...parse(await get(u))); } catch (e) { console.error('feed fail', f.id, u.slice(0, 70), e.message); } }));
    if (f.filter) items = items.filter(i => isGN(i.link) || f.filter.test(i.t + ' ' + i.d));
    const seen = new Set(); items = items.filter(i => { const k = i.t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50); return !seen.has(k) && seen.add(k); }).sort((a, b) => b.ts - a.ts).slice(0, PER_FEED);
    for (const it of items.slice(0, ENRICH)) { const p = prev.get(it.link); if (p) Object.assign(it, { sum: p.sum, pts: p.pts, ssc: p.ssc, ai: p.ai }); }
    await pool(items.slice(0, ENRICH).filter(i => !i.sum), KEY ? 1 : 5, enrich);
    for (const it of items) { if (!it.sum && it.d) it.sum = it.d; delete it.d; }
    out.feeds[f.id] = items.length ? items : (old.feeds?.[f.id] || []);
    console.log(f.id, out.feeds[f.id].length, 'items,', out.feeds[f.id].filter(i => i.sum).length, 'summarised');
  }
  writeFileSync('data/ca.json', JSON.stringify(out));
}

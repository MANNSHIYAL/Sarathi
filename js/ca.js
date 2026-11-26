import { store, settings } from './store.js';
import { getJSON } from './util.js';
import { FEEDS, isGN } from './feeds.js';
import { htmlToParas, summarize, aiPrompt } from './summarize.js';
import { aiReady, aiJSON } from './ai.js';
export { FEEDS, isGN };
const PROXIES = [u => u, u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u), u => 'https://corsproxy.io/?' + encodeURIComponent(u)];
async function fetchText(url, ok = x => x.includes('<item') || x.includes('<entry')) {
  let last;
  for (const p of PROXIES) {
    try { const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000); const r = await fetch(p(url), { signal: ac.signal }); clearTimeout(t); if (r.ok) { const x = await r.text(); if (ok(x)) return x; } } catch (e) { last = e; }
  }
  // JSON fallback (rss2json style)
  try { const j = await getJSON(settings.get('feedProxy') + encodeURIComponent(url)); if (j.items) return { json: j.items.map(i => ({ t: i.title, link: i.link, ts: Date.parse(i.pubDate) || 0, src: (j.feed && j.feed.title) || '' })) }; } catch (e) { last = e; }
  throw last || new Error('feed unreachable');
}
const stripD = h => { const d = document.createElement('div'); d.innerHTML = h.replace(/<script[\s\S]*?<\/script>/gi, ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
function parse(xml, fallbackSrc) {
  if (xml.json) return xml.json;
  const d = new DOMParser().parseFromString(xml, 'text/xml');
  const feedTitle = d.querySelector('channel > title')?.textContent || fallbackSrc || '';
  return [...d.querySelectorAll('item, entry')].map(it => {
    let t = (it.querySelector('title')?.textContent || '').trim(), src = it.querySelector('source')?.textContent || '';
    const m = t.match(/ - ([^-]{2,40})$/); if (m && (!src || src === m[1])) { src = m[1]; t = t.slice(0, -m[0].length); }
    const link = it.querySelector('link')?.textContent?.trim() || it.querySelector('link')?.getAttribute('href') || '';
    const ts = Date.parse(it.querySelector('pubDate, updated, published')?.textContent || '') || 0;
    const dd = stripD(it.querySelector('description, summary')?.textContent || '');
    return { t, link, ts, src: src || feedTitle.replace(/ - .*/, ''), sum: dd.length > 60 && !isGN(link) ? dd.slice(0, 500) : undefined };
  }).filter(i => i.t && /^https?:/.test(i.link));
}
export async function loadFeed(id, force = false) {
  const f = FEEDS.find(x => x.id === id), key = 'feed:' + id, c = store.get(key, null);
  if (!force && c && Date.now() - c.at < 30 * 60 * 1000) return { items: c.items, at: c.at, live: true };
  // 1) prebuilt JSON published by tools/update_content.mjs (GitHub Actions) if a content URL is set
  const cb = settings.get('contentBase') || 'data';
  { try { const j = await getJSON(cb.replace(/\/$/, '') + '/ca.json', { cache: 'no-cache' }); if (j.feeds?.[id]?.length) { store.set(key, { at: Date.parse(j.generated) || Date.now(), items: j.feeds[id] }); return { items: j.feeds[id], at: Date.parse(j.generated) || Date.now(), live: true, via: 'server refresh' }; } } catch { } }
  // 2) direct live fetch from the phone
  const got = await Promise.allSettled(f.urls.map(async u => parse(await fetchText(u))));
  let items = got.filter(g => g.status === 'fulfilled').flatMap(g => g.value);
  if (f.filter) items = items.filter(i => isGN(i.link) || f.filter.test(i.t + ' ' + (i.sum || '')));
  if (items.length) {
    const seen = new Set(); items = items.filter(i => { const k = i.t.toLowerCase().slice(0, 60); return !seen.has(k) && seen.add(k); }).sort((a, b) => b.ts - a.ts).slice(0, 40);
    store.set(key, { at: Date.now(), items }); return { items, at: Date.now(), live: true };
  }
  if (c) return { items: c.items, at: c.at, live: false };
  // 3) bundled snapshot
  try { const s = await getJSON('data/ca-snapshot.json'); return { items: s.feeds?.[id] || [], at: Date.parse(s.generated), live: false, snapshot: true }; } catch { return { items: [], at: 0, live: false }; }
}
export async function examUpdates() { try { return await getJSON('data/ca-snapshot.json'); } catch { return { updates: [] }; } }
export const ago = ts => { if (!ts) return ''; const m = (Date.now() - ts) / 6e4; return m < 60 ? Math.max(1, Math.round(m)) + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };

// On-demand summary for one item (used when the server refresh has not summarised it yet).
export async function summariseItem(item) {
  const cache = store.get('sums', {}); if (cache[item.link]) return cache[item.link];
  if (isGN(item.link)) throw new Error('This is a headline-only link. Open the source to read it.');
  const html = await fetchText(item.link, x => /<p[\s>]/i.test(x)); const paras = htmlToParas(html);
  if (!paras.length) throw new Error('Could not read this article here (the site blocks it). Open the source instead.');
  let r = null;
  if (aiReady()) { try { const o = await aiJSON(aiPrompt(item.t, paras.join(' '))); if (o.sum) r = { sum: String(o.sum), pts: (o.pts || []).map(String), ssc: o.ssc || undefined, ai: 1 }; } catch { } }
  r ||= summarize(paras); if (!r) throw new Error('Not enough text to summarise.');
  cache[item.link] = r; const keys = Object.keys(cache); if (keys.length > 150) delete cache[keys[0]]; store.set('sums', cache); return r;
}

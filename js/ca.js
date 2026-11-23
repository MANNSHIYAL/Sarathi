import { store, settings } from './store.js';
import { getJSON } from './util.js';
const gn = q => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
export const FEEDS = [
  { id: 'ssc', name: 'SSC updates', urls: [gn('SSC CGL when:30d'), gn('"Staff Selection Commission" notice when:30d')] },
  { id: 'india', name: 'India', urls: ['https://www.thehindu.com/news/national/feeder/default.rss', gn('India government scheme cabinet approves when:7d')] },
  { id: 'world', name: 'World & MEA', urls: [gn('"Ministry of External Affairs" India when:7d'), 'https://www.thehindu.com/news/international/feeder/default.rss'] },
  { id: 'eco', name: 'Economy', urls: [gn('RBI OR "Union Budget" OR GDP India economy when:7d'), 'https://www.thehindu.com/business/Economy/feeder/default.rss'] },
  { id: 'sci', name: 'Sci-Tech', urls: [gn('ISRO OR DRDO OR "India technology" when:14d')] },
  { id: 'misc', name: 'Awards & Sports', urls: [gn('India awards appointments sports when:7d')] }
];
const PROXIES = [u => u, u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u), u => 'https://corsproxy.io/?' + encodeURIComponent(u)];
async function fetchText(url) {
  let last;
  for (const p of PROXIES) {
    try { const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000); const r = await fetch(p(url), { signal: ac.signal }); clearTimeout(t); if (r.ok) { const x = await r.text(); if (x.includes('<item') || x.includes('<entry')) return x; } } catch (e) { last = e; }
  }
  // JSON fallback (rss2json style)
  try { const j = await getJSON(settings.get('feedProxy') + encodeURIComponent(url)); if (j.items) return { json: j.items.map(i => ({ t: i.title, link: i.link, ts: Date.parse(i.pubDate) || 0, src: (j.feed && j.feed.title) || '' })) }; } catch (e) { last = e; }
  throw last || new Error('feed unreachable');
}
function parse(xml, fallbackSrc) {
  if (xml.json) return xml.json;
  const d = new DOMParser().parseFromString(xml, 'text/xml');
  const feedTitle = d.querySelector('channel > title')?.textContent || fallbackSrc || '';
  return [...d.querySelectorAll('item, entry')].map(it => {
    let t = (it.querySelector('title')?.textContent || '').trim(), src = it.querySelector('source')?.textContent || '';
    const m = t.match(/ - ([^-]{2,40})$/); if (m && (!src || src === m[1])) { src = m[1]; t = t.slice(0, -m[0].length); }
    const link = it.querySelector('link')?.textContent?.trim() || it.querySelector('link')?.getAttribute('href') || '';
    const ts = Date.parse(it.querySelector('pubDate, updated, published')?.textContent || '') || 0;
    return { t, link, ts, src: src || feedTitle.replace(/ - .*/, '') };
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

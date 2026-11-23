// Server-side refresh of live feeds -> data/ca.json. Run by GitHub Actions every 3 hours (see .github/workflows/refresh.yml).
// Node 18+, no dependencies.  Usage: node tools/update_content.mjs
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const gn = q => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
export const FEEDS = {
  ssc: [gn('SSC CGL when:30d'), gn('"Staff Selection Commission" notice when:30d')],
  india: ['https://www.thehindu.com/news/national/feeder/default.rss', gn('India government scheme cabinet approves when:7d')],
  world: [gn('"Ministry of External Affairs" India when:7d'), 'https://www.thehindu.com/news/international/feeder/default.rss'],
  eco: [gn('RBI OR "Union Budget" OR GDP India economy when:7d'), 'https://www.thehindu.com/business/Economy/feeder/default.rss'],
  sci: [gn('ISRO OR DRDO OR "India technology" when:14d')],
  misc: [gn('India awards appointments sports when:7d')]
};
const dec = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim();
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? dec(m[1]) : ''; };
export function parse(xml) {
  const ch = tag(xml, 'title');
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)].map(m => {
    const x = m[0]; let t = tag(x, 'title'), src = tag(x, 'source'); const mm = t.match(/ - ([^-]{2,40})$/); if (mm && (!src || src === mm[1])) { src = mm[1]; t = t.slice(0, -mm[0].length); }
    return { t, link: tag(x, 'link'), ts: Date.parse(tag(x, 'pubDate')) || 0, src: src || ch.replace(/ - .*/, '') };
  }).filter(i => i.t && /^https?:/.test(i.link));
}
async function get(u) { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 SarthiBot' }, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error(r.status); return r.text(); }
if (process.argv[1] && process.argv[1].endsWith('update_content.mjs')) {
  const old = existsSync('data/ca.json') ? JSON.parse(readFileSync('data/ca.json', 'utf8')) : { feeds: {} };
  const out = { generated: new Date().toISOString(), feeds: {} };
  for (const [id, urls] of Object.entries(FEEDS)) {
    let items = [];
    for (const u of urls) { try { items.push(...parse(await get(u))); } catch (e) { console.error('fail', id, u, e.message); } }
    const seen = new Set(); items = items.filter(i => { const k = i.t.toLowerCase().slice(0, 60); return !seen.has(k) && seen.add(k); }).sort((a, b) => b.ts - a.ts).slice(0, 40);
    out.feeds[id] = items.length ? items : (old.feeds[id] || []);
    console.log(id, out.feeds[id].length);
  }
  writeFileSync('data/ca.json', JSON.stringify(out));
}

import { getJSON, esc } from './util.js';
let B = null;
export async function loadBooks() { if (!B) { try { B = (await getJSON('data/books.json')).books.map(b => ({ ...b, re: b.m.map(x => new RegExp(x, 'i')) })); } catch { B = []; } } return B; }
// Returns small link chips for every known book mentioned in `text` (call loadBooks() first).
export function bookLinks(text) {
  if (!B) return '';
  const t = String(text || ''), seen = new Set(); let out = '';
  for (const b of B) {
    if (seen.has(b.title) || !b.re.some(r => r.test(t))) continue; seen.add(b.title);
    if (b.free) out += `<a class="bl" href="${esc(b.free)}" target="_blank" rel="noopener">${esc(b.freeLabel || 'Free')} ↗</a>`;
    if (b.q) out += `<a class="bl" href="https://www.amazon.in/s?k=${encodeURIComponent(b.q)}" target="_blank" rel="noopener">Buy ↗</a><a class="bl" href="https://archive.org/search?query=${encodeURIComponent(b.q)}" target="_blank" rel="noopener">Borrow ↗</a>`;
  }
  return out ? `<span class="bls">${out}</span>` : '';
}

// ---- Free resources (search links, nothing is hard-coded to a page that can disappear) and the user's own links ----
import { store } from './store.js';
const q = encodeURIComponent;
export function freeLinks(topic, sub) {
  const t = String(topic || '').replace(/^Part \d+:\s*/, ''), a = (h, l) => `<a class="bl" href="${h}" target="_blank" rel="noopener">${l} ↗</a>`;
  let out = a(`https://www.youtube.com/results?search_query=${q(t + ' SSC CGL free lecture')}`, '▶ Free video')
    + a(`https://www.google.com/search?q=${q(t + ' SSC CGL notes pdf free')}`, '📄 Free notes');
  if (sub === 'g') out += a(`https://en.wikipedia.org/w/index.php?search=${q(t)}`, 'Wikipedia') + a('https://ncert.nic.in/textbook.php', 'NCERT (free)');
  if (sub === 'e') out += a(`https://www.google.com/search?q=${q(t + ' English grammar exercises with answers')}`, 'Free exercises');
  if (sub === 'q' || sub === 'r') out += a(`https://www.google.com/search?q=${q(t + ' SSC CGL practice questions with solutions')}`, 'Free practice');
  return `<span class="bls">${out}</span>`;
}
const okUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
export const myLinks = key => store.get('mylinks', {})[key] || [];
export function myLinksHtml(key) {
  const L = myLinks(key);
  return `<div class="bls" style="margin-top:6px"><b class="sub" style="margin:0 6px 0 0">My links:</b>${L.map((l, i) => `<a class="bl" href="${esc(l.u)}" target="_blank" rel="noopener">${esc(l.t)} ↗</a><button class="bl" data-rm="${esc(key)}|${i}" title="Remove" style="border:0">✕</button>`).join('')}<button class="bl" data-addlink="${esc(key)}">＋ Add my link</button></div>`;
}
// Call after the HTML is in the page. `redraw` is called after a change.
export function bindMyLinks(root, redraw) {
  root.querySelectorAll('[data-addlink]').forEach(b => b.onclick = () => {
    const u = okUrl((prompt('Paste the link (https://…) to a free resource:') || '').trim()); if (!u) return;
    const t = (prompt('Short name for this link:', new URL(u).hostname.replace(/^www\./, '')) || '').trim().slice(0, 40) || 'My link';
    const all = store.get('mylinks', {}), k = b.dataset.addlink; (all[k] = all[k] || []).push({ t, u }); store.set('mylinks', all); redraw();
  });
  root.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    const [k, i] = b.dataset.rm.split('|'), all = store.get('mylinks', {}); (all[k] || []).splice(+i, 1); store.set('mylinks', all); redraw();
  });
}

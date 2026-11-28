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

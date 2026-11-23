export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const pad = n => String(n).padStart(2, '0');
export const mmss = sec => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? pad(h) + ':' : '') + pad(m) + ':' + pad(s); };
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.random() * a.length | 0];
export const ri = (a, b) => a + (Math.random() * (b - a + 1) | 0);
export const r2 = n => Math.round(n * 100) / 100;
export const today = () => new Date().toISOString().slice(0, 10);
export const daysUntil = d => Math.ceil((new Date(d + 'T09:00:00+05:30') - Date.now()) / 864e5);
export const dfmt = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export function toast(msg, ms = 2200) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms); }
export function sheet(html, onMount) {
  const s = document.createElement('div'); s.className = 'sheet';
  s.innerHTML = `<div>${html}</div>`;
  s.addEventListener('click', e => { if (e.target === s) s.remove(); });
  document.body.appendChild(s); onMount && onMount(s.firstElementChild, () => s.remove()); return () => s.remove();
}
export async function getJSON(url, opts) { const r = await fetch(url, opts); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }

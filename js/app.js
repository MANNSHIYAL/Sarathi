import { $, $$ } from './util.js';
import { settings } from './store.js';
const routes = {
  home: () => import('./views/home.js'), mock: () => import('./views/mock.js'), practice: () => import('./views/practice.js'),
  news: () => import('./views/news.js'), more: () => import('./views/more.js'), result: () => import('./views/result.js'),
  exam: () => import('./exam.js'), tutor: () => import('./views/tutor.js'), dest: () => import('./views/dest.js')
};
let cleanup = null;
async function route() {
  const [name, ...rest] = (location.hash.replace(/^#\//, '') || 'home').split('/');
  const key = routes[name] ? name : 'home';
  if (cleanup) { try { cleanup(); } catch { } cleanup = null; }
  document.body.classList.toggle('exam-mode', key === 'exam');
  $$('#tabbar a').forEach(a => a.classList.toggle('on', a.dataset.t === (key === 'exam' || key === 'result' || key === 'dest' ? 'mock' : key)));
  const app = $('#app'); app.innerHTML = '<p class="sub">Loading…</p>';
  try {
    const mod = await routes[key]();
    cleanup = (await mod.render(app, rest.map(decodeURIComponent))) || null;
    if (key !== 'exam') window.scrollTo(0, 0);
  } catch (e) { console.error(e); app.innerHTML = `<div class="card"><h3>Something went wrong</h3><p class="sub">${String(e.message || e)}</p><a class="btn" href="#/home">Home</a></div>`; }
}
function theme() {
  const t = settings.get('theme'); if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
}
$('#btnTheme').onclick = () => { const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); settings.set({ theme: cur === 'dark' ? 'light' : 'dark' }); theme(); };
theme();
addEventListener('hashchange', route); route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });

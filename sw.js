const V = 'sarthi-v9';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/app.js', 'js/util.js', 'js/store.js', 'js/data.js', 'js/exam.js', 'js/gen.js', 'js/ai.js', 'js/views/home.js', 'js/views/mock.js', 'js/views/practice.js', 'js/views/news.js', 'js/views/more.js', 'js/views/notes.js', 'js/views/stats.js', 'js/views/week.js', 'js/views/dest.js', 'js/views/tutor.js', 'data/dest.json', 'js/books.js', 'data/books.json', 'js/ca.js', 'js/summarize.js', 'js/feeds.js', 'js/views/result.js', 'data/exam-config.json', 'data/qbank.json', 'data/ca-snapshot.json', 'data/plan.json', 'data/notes.json', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return; // live feeds + AI go straight to network
  const fresh = u.pathname.includes('/data/');
  if (fresh) { // network first so content updates arrive, cache fallback offline
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); return res; }).catch(() => caches.match(r)));
  } else {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); return res; })));
  }
});

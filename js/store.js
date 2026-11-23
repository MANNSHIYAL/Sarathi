const P = 'sarthi:';
export const store = {
  get(k, d) { try { const v = localStorage.getItem(P + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(P + k); } catch { } }
};
const DEF = {
  tier1Date: '2027-07-15', tier2Date: '2027-12-10', category: 'ur',
  geminiKey: '', geminiModel: 'gemini-2.5-flash', sectionLock: true, theme: 'auto',
  contentBase: '', feedProxy: 'https://api.rss2json.com/v1/api.json?rss_url=', planStart: ''
};
export const settings = {
  all() { return { ...DEF, ...store.get('settings', {}) }; },
  get(k) { return this.all()[k]; },
  set(patch) { store.set('settings', { ...store.get('settings', {}), ...patch }); }
};
export const history = {
  list() { return store.get('attempts', []); },
  add(a) { const l = this.list(); l.unshift(a); store.set('attempts', l.slice(0, 60)); },
  clear() { store.del('attempts'); }
};
// per-question memory: wrong-answer notebook + seen counter
export const memory = {
  all() { return store.get('qmem', {}); },
  record(items) {
    const m = this.all();
    for (const it of items) {
      const e = m[it.id] || { seen: 0, wrong: 0 };
      e.seen++; if (it.status === 'wrong') e.wrong++; e.last = it.status;
      m[it.id] = e;
    }
    store.set('qmem', m);
  },
  wrongIds() { const m = this.all(); return Object.keys(m).filter(k => m[k].last === 'wrong'); }
};

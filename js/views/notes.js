import { esc, $, $$, getJSON, shuffle } from '../util.js';
import { store } from '../store.js';
export async function notesView(app, back) {
  const N = await getJSON('data/notes.json'); let tab = 'formulas', i = 0, flip = false, deck = [];
  const known = () => store.get('known-cards', {});
  const draw = () => {
    let body = '';
    if (tab === 'formulas') body = `<div class="card list">${N.formulas.map(f => `<div class="item"><div class="t">${esc(f[0])}</div><div class="m" style="font-size:13px;color:var(--ink)">${esc(f[1])}</div></div>`).join('')}</div>`;
    else {
      const src = N[tab], k = known(); deck = deck.length && deck._t === tab ? deck : Object.assign(shuffle(src.map((c, n) => n)), { _t: tab }); const c = src[deck[i % deck.length]], key = tab + ':' + c[0];
      body = `<div class="card" style="min-height:170px;text-align:center;display:flex;flex-direction:column;justify-content:center;cursor:pointer" id="fc"><div class="sub">${i % deck.length + 1} / ${deck.length} · ${Object.keys(k).filter(x => x.startsWith(tab + ':')).length} known</div><div style="font-size:${flip ? 15 : 24}px;font-weight:${flip ? 400 : 700}">${esc(flip ? c[1] : c[0])}</div><div class="sub">${flip ? '' : 'Tap to reveal'}</div></div>
      <div class="row"><button class="btn alt sp" id="nx">Again</button><button class="btn ok sp" id="gt">Got it</button></div>`;
      setTimeout(() => { const fc = $('#fc'); if (!fc) return; fc.onclick = () => { flip = !flip; draw(); }; $('#nx').onclick = () => { i++; flip = false; draw(); }; $('#gt').onclick = () => { const kk = known(); kk[key] = 1; store.set('known-cards', kk); i++; flip = false; draw(); }; });
    }
    $('#nb').innerHTML = body;
    $$('#nt button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  };
  app.innerHTML = `${back}<h1>Notes &amp; flashcards</h1><div class="tabs" id="nt"><button data-t="formulas">Formulas</button><button data-t="glossary">Diplomacy terms</button><button data-t="vocab">Vocabulary</button></div><div id="nb"></div>`;
  $$('#nt button').forEach(b => b.onclick = () => { tab = b.dataset.t; i = 0; flip = false; deck = []; draw(); }); draw();
}

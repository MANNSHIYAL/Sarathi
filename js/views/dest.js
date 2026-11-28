import { esc, $, mmss } from '../util.js';
import { getJSON } from '../util.js';
const KEY='dest-hist';
const hist=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const save=r=>{try{localStorage.setItem(KEY,JSON.stringify([r,...hist()].slice(0,30)))}catch{}};
function passage(pool,min){const p=[...pool].sort(()=>Math.random()-.5);let s='';for(const x of p){if(s.length>=min)break;s+=(s?' ':'')+x}return s}
export function score(src,typed){
  const a=src.split(/\s+/),b=typed.trim().split(/\s+/).filter(Boolean);let err=0;
  b.forEach((w,i)=>{if(w!==a[i])err++});
  return{kd:typed.length,words:b.length,err,pct:b.length?+(err*100/b.length).toFixed(1):0};
}
export async function render(app){
  const c=await getJSON('data/dest.json');
  const h=hist();
  app.innerHTML=`<h1>Data entry test</h1><p class="sub">Tier-II skill test practice. Type the passage exactly as shown, in ${c.minutes} minutes. Target: ${c.target} key depressions with at most ${c.maxErrPct}% wrong words (check the latest notice for exact limits; this is a practice standard).</p>
  <div class="card" id="box"><button class="btn block" id="go">Start test</button></div>
  <h2>Past attempts</h2><div class="card list">${h.length?h.map(r=>`<div class="item"><div class="row"><span class="t sp">${new Date(r.ts).toLocaleString('en-IN')}</span><b>${r.pass?'Pass':'Fail'}</b></div><div class="m">${r.kd} key depressions · ${r.words} words · ${r.err} wrong (${r.pct}%) · ${mmss(r.secs)}</div></div>`).join(''):'<p class="sub">No attempts yet.</p>'}</div>`;
  let timer;
  $('#go').onclick=()=>{
    const src=passage(c.pool,2600),end=Date.now()+c.minutes*60000;
    $('#box').innerHTML=`<div class="row"><b class="sp">Time left <span id="tm">${mmss(c.minutes*60)}</span></b><b id="kd">0</b><span class="sub" style="margin:0">&nbsp;keys</span></div>
    <div id="src" style="margin:10px 0;line-height:1.7;font-size:16px;user-select:none;-webkit-user-select:none"></div>
    <textarea id="ty" rows="8" style="width:100%;font-size:16px" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Start typing here…"></textarea>
    <button class="btn alt block" id="fin" style="margin-top:8px">Finish now</button>`;
    const ty=$('#ty'),srcEl=$('#src');
    ty.onpaste=e=>e.preventDefault();
    const paint=()=>{const w=src.split(' '),t=ty.value.split(' ');
      srcEl.innerHTML=w.map((x,i)=>{const cur=i===t.length-1;const done=i<t.length-1;const bad=done&&t[i]!==x;
        return `<span style="${bad?'color:#d33;text-decoration:underline':done?'opacity:.45':cur?'background:var(--accent);color:#fff;border-radius:3px;padding:0 2px':''}">${esc(x)}</span>`}).join(' ')};
    paint();ty.focus();
    ty.oninput=()=>{$('#kd').textContent=ty.value.length;paint()};
    const done=()=>{clearInterval(timer);const s=score(src,ty.value),secs=Math.round((c.minutes*60000-Math.max(0,end-Date.now()))/1000);
      const pass=s.kd>=c.target&&s.pct<=c.maxErrPct;save({ts:Date.now(),...s,pass,secs});
      $('#box').innerHTML=`<h3>${pass?'Passed':'Not yet'}</h3><p>Key depressions: <b>${s.kd}</b> (target ${c.target})<br>Words typed: ${s.words}, wrong: ${s.err} (${s.pct}%)<br>Speed: about ${Math.round(s.kd*3600/Math.max(secs,60))} key depressions per hour</p><button class="btn block" id="again">Try again</button>`;
      $('#again').onclick=()=>render(app)};
    $('#fin').onclick=done;
    const tick=()=>{const l=Math.max(0,Math.round((end-Date.now())/1000));$('#tm').textContent=mmss(l);if(!l)done()};
    timer=setInterval(tick,500);
  };
  return()=>clearInterval(timer);
}

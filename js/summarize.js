// Pure text helpers shared by the browser app and tools/update_content.mjs (no DOM, no dependencies).
const STOP = new Set('the a an and or but if then than that this these those with without for from into onto over under about after before while during of in on at by to as is are was were be been being it its he she they them his her their we you i not no nor so such also has have had will would can could may might should said says say new more most other some any all each both very just only own same too out up down off here there when where which who whom whose what how why one two year years per'.split(' '));
const DEC = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#039;': "'", '&nbsp;': ' ', '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&ndash;': '–', '&mdash;': '—', '&hellip;': '…' };
export const decode = s => String(s || '').replace(/&(?:amp|lt|gt|quot|#0?39|nbsp|rsquo|lsquo|ldquo|rdquo|ndash|mdash|hellip);/g, m => DEC[m]).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
export const stripTags = s => decode(String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const JUNK = /subscribe|sign in|log in|copyright|all rights reserved|also read|read more|follow us|cookie|advertisement|newsletter|click here|whatsapp|telegram|download the app|terms of use|privacy policy|comments? (?:have|has) been|please note/i;
export function htmlToParas(html) {
  let h = String(html || '').replace(/<(script|style|noscript|svg|nav|footer|header|aside|form|iframe|button)[\s\S]*?<\/\1>/gi, ' ');
  const a = h.search(/<article[\s>]/i); if (a >= 0) h = h.slice(a);
  const out = []; for (const m of h.matchAll(/<p[\s>][\s\S]*?<\/p>/gi)) { const t = stripTags(m[0]); if (t.split(' ').length >= 7 && !JUNK.test(t)) out.push(t); }
  return out;
}
const ABBR = /\b(Mr|Mrs|Ms|Dr|Prof|Rs|No|St|Sr|Jr|vs|etc|Inc|Ltd|Co|Lt|Col|Gen|Sen|Rep|Govt|Dept|Mt|Jan|Feb|Aug|Sept|Oct|Nov|Dec)\./g;
export function sentences(text) {
  const t = text.replace(ABBR, m => m.slice(0, -1) + '․').replace(/\b([A-Z])\.(?=[A-Z]\.)/g, '$1․').replace(/\b([A-Z])\.\s(?=[A-Z][a-z])/g, '$1․ ');
  return t.split(/(?<=[.!?])["”’']?\s+(?=["“‘']?[A-Z0-9])/).map(s => s.replace(/․/g, '.').trim()).filter(s => s.length >= 40 && s.length <= 420);
}
export function summarize(input, opts = {}) {
  const paras = Array.isArray(input) ? input : [String(input || '')];
  const text = paras.join(' ').slice(0, 12000), S = sentences(text); if (!S.length) return null;
  const tf = {}; for (const w of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []) if (!STOP.has(w)) tf[w] = (tf[w] || 0) + 1;
  const scored = S.map((s, i) => {
    const ws = s.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []; let sc = 0; for (const w of ws) if (!STOP.has(w)) sc += tf[w] || 0;
    sc /= Math.pow(ws.length || 1, 0.6); if (/\d/.test(s)) sc *= 1.2; if ((s.slice(1).match(/\b[A-Z][a-z]+/g) || []).length >= 3) sc *= 1.15; if (i === 0) sc *= 1.6; else if (i === 1) sc *= 1.25;
    if (/^(?:Follow|Also|Read|Watch|Click|Photo|Image|Representational)/.test(s)) sc *= 0.2; return { s, i, sc };
  });
  const take = scored.slice().sort((a, b) => b.sc - a.sc).slice(0, opts.n || 5).sort((a, b) => a.i - b.i).map(x => x.s);
  const sum = take.slice(0, 2).join(' ').slice(0, 460);
  const pts = take.slice(2).concat(take.length < 3 ? [] : []).map(s => s.length > 230 ? s.slice(0, 227).replace(/\s\S*$/, '') + '…' : s);
  return { sum, pts: pts.length ? pts : [] };
}
export function aiPrompt(title, text) {
  return `You summarise news for an SSC CGL aspirant (General Awareness). Use ONLY the article text. Do not invent facts.\nHeadline: ${title}\nArticle:\n${String(text).slice(0, 6000)}\nReturn JSON: {"sum":"2-3 plain sentences covering who/what/where/when","pts":["3-5 short key facts: names, numbers, dates, places, schemes"],"ssc":"one short line on the exam-relevant fact to remember, or empty string"}`;
}

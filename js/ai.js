import { settings, store } from './store.js';
import { resetBank } from './data.js';
export const aiReady = () => !!settings.get('geminiKey');
export async function aiJSON(prompt) {
  const key = settings.get('geminiKey'); if (!key) throw new Error('Add your free Gemini key in More → Settings first.');
  const model = settings.get('geminiModel') || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.7 } })
  });
  if (!r.ok) { let m = ''; try { m = (await r.json()).error.message; } catch { } throw new Error('AI error ' + r.status + ' ' + m.slice(0, 160)); }
  const j = await r.json(); const t = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  try { return JSON.parse(t.replace(/^```json|```$/g, '').trim()); } catch { throw new Error('AI returned unreadable output. Try again.'); }
}
const SEC = { quant: 'Quantitative Aptitude (Class 10 level arithmetic, algebra, geometry, trigonometry, mensuration, DI)', reasoning: 'General Intelligence and Reasoning', english: 'English Language and Comprehension (vocabulary, grammar, error spotting, cloze, idioms)', ga: 'General Awareness (polity, history, geography, economy, science, static GK, international relations, MEA and diplomacy)', computer: 'Computer Knowledge (fundamentals, MS Office, internet, security)' };
export function validQ(q) { return q && typeof q.q === 'string' && Array.isArray(q.o) && q.o.length === 4 && new Set(q.o.map(String)).size === 4 && Number.isInteger(q.a) && q.a >= 0 && q.a < 4; }
export async function aiQuestions({ sec, topic = '', n = 10, context = '' }) {
  const p = `You are an expert SSC CGL paper-setter. Write ${n} NEW multiple-choice questions for ${SEC[sec]}${topic ? ', topic: ' + topic : ''}, at SSC CGL Tier-I/Tier-II difficulty. Each has exactly 4 distinct options and exactly one correct option. Verify every calculation. Give a one or two sentence explanation.${context ? '\nBase the questions ONLY on these facts:\n' + context : ''}
Return JSON: {"questions":[{"q":"...","o":["A","B","C","D"],"a":0,"e":"...","t":"topic"}]} where a is the index (0-3) of the correct option.`;
  const res = await aiJSON(p); const list = (res.questions || res).filter(validQ);
  const bankAI = store.get('ai-bank', []);
  const made = list.map(q => ({ id: 'ai-' + Math.abs([...q.q].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36), s: sec, t: q.t || topic || 'AI', q: q.q, o: q.o.map(String), a: q.a, e: q.e || '' }));
  const known = new Set(bankAI.map(x => x.id)); store.set('ai-bank', [...made.filter(m => !known.has(m.id)), ...bankAI].slice(0, 800)); resetBank();
  return made;
}
export async function aiChat({ system, messages, image }) {
  const key = settings.get('geminiKey'); if (!key) throw new Error('Add your free Gemini key in More → Settings first.');
  const model = settings.get('geminiModel') || 'gemini-2.5-flash';
  const contents = messages.map((m, i) => {
    const parts = [{ text: m.text }];
    if (image && i === messages.length - 1 && m.role === 'user') parts.push({ inlineData: { mimeType: image.mime, data: image.data } });
    return { role: m.role === 'user' ? 'user' : 'model', parts };
  });
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: 0.5 } })
  });
  if (!r.ok) { let m = ''; try { m = (await r.json()).error.message; } catch { } throw new Error('AI error ' + r.status + ' ' + m.slice(0, 160)); }
  const j = await r.json(); const t = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  if (!t) throw new Error('The tutor returned no answer. Try again.'); return t;
}

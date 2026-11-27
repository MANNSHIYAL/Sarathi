// Procedural Maths + Reasoning questions at SSC CGL level. Every answer is computed, so it is always correct.
import { ri, pick, shuffle } from './util.js';
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const f = n => { n = Math.round(n * 100) / 100; return Number.isInteger(n) ? String(n) : String(n); };
let C = 0;
function mc(sec, topic, q, correct, wrongs, expl, fmt = f) {
  const set = [fmt(correct)]; const ws = wrongs.map(fmt);
  for (const w of ws) if (!set.includes(w) && set.length < 4) set.push(w);
  let k = 1; while (set.length < 4 && typeof correct === 'number') { const w = fmt(correct + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.max(1, Math.round(Math.abs(correct) * 0.07))); if (!set.includes(w)) set.push(w); k++; if (k > 30) break; }
  while (set.length < 4) set.push('None of these ' + set.length);
  const o = shuffle(set);
  return { id: 'g-' + Date.now().toString(36) + (C++), s: sec, t: topic, q, o, a: o.indexOf(fmt(correct)), e: expl };
}
const nm = () => pick(['Amit', 'Ravi', 'Sneha', 'Priya', 'Karan', 'Neha', 'Vikas', 'Pooja']);
const Q = {
  percent() { const p = pick([5, 8, 12, 15, 20, 25, 35, 40, 45, 60]), v = ri(2, 40) * 20; const a = v * p / 100; return mc('quant', 'Percentage', `What is ${p}% of ${v}?`, a, [a + 10, a - 5, a * 2, v / p * 10], `${p}/100 × ${v} = ${a}`); },
  percentChange() { const p = pick([10, 20, 25, 50]), n = ri(4, 30) * 20, nv = n * (100 + p) / 100; return mc('quant', 'Percentage', `A number is increased by ${p}% and becomes ${nv}. What was the number?`, n, [n + 20, n - 20, nv - p, n * 1.1], `Number × ${100 + p}/100 = ${nv}, so number = ${n}`); },
  profit() { const cp = ri(5, 40) * 100, p = pick([10, 20, 25, 5, 15]), sp = cp * (100 + p) / 100; return mc('quant', 'Profit & Loss', `An article bought for ₹${cp} is sold at a profit of ${p}%. Find the selling price (₹).`, sp, [cp + p, sp + 50, cp * (100 - p) / 100, sp - 100], `SP = ${cp} × ${100 + p}/100 = ${sp}`); },
  loss() { const sp = ri(4, 30) * 100, l = pick([10, 20, 25]), cp = sp * 100 / (100 - l); if (!Number.isInteger(cp)) return Q.loss(); return mc('quant', 'Profit & Loss', `By selling an item for ₹${sp}, a shopkeeper incurs a loss of ${l}%. Find its cost price (₹).`, cp, [sp * (100 + l) / 100, sp + l * 10, cp + 100, cp - 100], `CP = ${sp} × 100/${100 - l} = ${cp}`); },
  discount() { const mp = ri(4, 30) * 100, d1 = pick([10, 20, 25]), d2 = pick([5, 10]); const sp = mp * (100 - d1) / 100 * (100 - d2) / 100; return mc('quant', 'Discount', `A shirt marked ₹${mp} is sold after successive discounts of ${d1}% and ${d2}%. Find the selling price (₹).`, sp, [mp * (100 - d1 - d2) / 100, mp * (100 - d1) / 100, sp + 20, sp - 15], `${mp} × ${100 - d1}/100 × ${100 - d2}/100 = ${f(sp)}`); },
  ratio() { const a = ri(2, 5), b = ri(a + 1, 8), k = ri(3, 12) * 10, tot = (a + b) * k; return mc('quant', 'Ratio', `₹${tot} is divided between ${nm()} and ${nm()} in the ratio ${a}:${b}. What is the larger share (₹)?`, b * k, [a * k, b * k + k, (a + b) * k / 2, b * k - k], `One part = ${tot}/${a + b} = ${k}; larger = ${b} × ${k} = ${b * k}`); },
  si() { const P = ri(2, 20) * 500, R = pick([4, 5, 6, 8, 10]), T = ri(2, 5), si = P * R * T / 100; return mc('quant', 'Interest', `Find the simple interest (₹) on ₹${P} at ${R}% per annum for ${T} years.`, si, [si + P / 10, si * 2, P * R / 100, si - 50], `SI = P×R×T/100 = ${P}×${R}×${T}/100 = ${si}`); },
  ci() { const P = pick([4000, 5000, 8000, 10000, 20000]), R = pick([5, 10, 20]), A = P * (1 + R / 100) ** 2, ci = A - P; return mc('quant', 'Interest', `Find the compound interest (₹) on ₹${P} for 2 years at ${R}% per annum, compounded annually.`, ci, [P * R * 2 / 100, ci + P / 50, ci - P / 100, A], `A = ${P}(1+${R}/100)² = ${f(A)}; CI = A − P = ${f(ci)}`); },
  work() { const [x, y] = pick([[12, 24], [10, 15], [20, 30], [15, 10], [18, 9], [30, 20], [6, 3], [40, 60]]); const t = x * y / (x + y); return mc('quant', 'Time & Work', `A can finish a job in ${x} days and B in ${y} days. Working together, in how many days will they finish it?`, t, [(x + y) / 2, t + 2, t - 1, x + y - t], `Together = ${x}×${y}/(${x}+${y}) = ${f(t)} days`); },
  speed() { const v = pick([36, 54, 72, 90]), t = ri(5, 20), d = v * 5 / 18 * t; return mc('quant', 'Speed & Distance', `A train running at ${v} km/h crosses a pole in ${t} seconds. Find its length (m).`, d, [d + 50, d - 50, v * t, d * 2], `${v} km/h = ${v * 5 / 18} m/s; length = ${v * 5 / 18} × ${t} = ${d} m`); },
  avgSpeed() { const a = pick([20, 30, 40, 60]), b = pick([30, 40, 60, 90]); if (a === b) return Q.avgSpeed(); const v = 2 * a * b / (a + b); return mc('quant', 'Speed & Distance', `A man goes to a place at ${a} km/h and returns by the same route at ${b} km/h. Find the average speed (km/h).`, v, [(a + b) / 2, v + 2, v - 3, Math.sqrt(a * b)], `Average speed = 2ab/(a+b) = ${f(v)}`); },
  average() { const n = ri(4, 8), avg = ri(20, 60), x = ri(1, 9) * 5, nw = (avg * n + avg + x) / (n + 1); if (!Number.isInteger(nw * 100)) return Q.average(); return mc('quant', 'Average', `The average of ${n} numbers is ${avg}. A new number ${avg + x} is added. Find the new average.`, nw, [avg + x, avg, nw + 1, (avg + x) / 2], `Sum = ${avg * n}; new sum = ${avg * n + avg + x}; ÷${n + 1} = ${f(nw)}`); },
  hcf() { const h = pick([3, 4, 6, 7, 9, 12]), a = h * pick([2, 3, 4, 5]), b = h * pick([5, 7, 8, 9]); const g = (x, y) => y ? g(y, x % y) : x, G = g(a, b), L = a * b / G; const ask = pick(['HCF', 'LCM']); return mc('quant', 'Number System', `Find the ${ask} of ${a} and ${b}.`, ask === 'HCF' ? G : L, ask === 'HCF' ? [G * 2, L, G + 1, a - b > 0 ? a - b : b - a] : [a * b, L / 2, L + G, L * 2], `HCF = ${G}, LCM = ${a}×${b}/${G} = ${L}`); },
  circle() { const r = pick([7, 14, 21, 28]), a = 22 / 7 * r * r; return mc('quant', 'Mensuration', `Find the area of a circle with radius ${r} cm (π = 22/7), in cm².`, a, [2 * 22 / 7 * r, a * 2, a / 2, r * r], `πr² = 22/7 × ${r}² = ${a}`); },
  rect() { const l = pick([12, 16, 24, 15]), b = pick([5, 9, 7, 8]); const d = Math.sqrt(l * l + b * b); if (!Number.isInteger(d)) return Q.rect2(l, b); return mc('quant', 'Mensuration', `A rectangle has length ${l} cm and breadth ${b} cm. Find the length of its diagonal (cm).`, d, [l + b, d + 1, d - 1, l * b / 10], `√(${l}²+${b}²) = ${d}`); },
  rect2(l, b) { return mc('quant', 'Mensuration', `Find the area (cm²) of a rectangle with length ${l} cm and breadth ${b} cm.`, l * b, [2 * (l + b), l * b + l, l + b, l * b - b], `${l} × ${b} = ${l * b}`); },
  cyl() { const r = pick([7, 14]), h = ri(2, 10), v = 22 / 7 * r * r * h; return mc('quant', 'Mensuration', `Volume of a cylinder with radius ${r} cm and height ${h} cm (π = 22/7), in cm³?`, v, [v / 2, v * 2, 22 / 7 * r * h, v + 154], `πr²h = 22/7 × ${r * r} × ${h} = ${v}`); },
  simplify() { const a = ri(10, 50), b = ri(2, 9), c = ri(2, 9), d = ri(2, 6) * c, v = a + b * c - d / c; return mc('quant', 'Simplification', `Simplify: ${a} + ${b} × ${c} − ${d} ÷ ${c}`, v, [(a + b) * c - d / c, v + c, v - 2, a + b * c - d], `BODMAS: ${a} + ${b * c} − ${d / c} = ${v}`); },
  algebra() { const k = ri(2, 9), v = k * k - 2; return mc('quant', 'Algebra', `If x + 1/x = ${k}, find the value of x² + 1/x².`, v, [k * k, k * k + 2, 2 * k, v - 1], `(x+1/x)² = x²+1/x²+2, so ${k * k} − 2 = ${v}`); },
  algebra2() { const a = ri(3, 9), b = ri(1, 7); return mc('quant', 'Algebra', `If a + b = ${a + b} and ab = ${a * b}, find a² + b².`, a * a + b * b, [(a + b) ** 2, a * a + b * b + 2 * a * b, a * a + b * b - 2, 2 * a * b], `a²+b² = (a+b)² − 2ab = ${(a + b) ** 2} − ${2 * a * b}`); },
  trig() { const t = pick([['sin 30° + cos 60°', 1, ['1/2', '0', '√3/2'], '½ + ½ = 1'], ['sin²45° + cos²45°', 1, ['1/2', '2', '0'], 'sin²θ+cos²θ = 1'], ['tan 45° × sin 90°', 1, ['0', '2', '√3'], '1 × 1 = 1'], ['cos 0° + sin 90°', 2, ['1', '0', '3'], '1 + 1 = 2'], ['sin 30° × cos 60°', '1/4', ['1/2', '1', '3/4'], '½ × ½ = ¼']]); return mc('quant', 'Trigonometry', `Find the value of ${t[0]}.`, t[1], t[2], t[3], String); },
  geometry() { const n = pick([5, 6, 8, 10, 12]), a = 180 * (n - 2) / n; return mc('quant', 'Geometry', `Find each interior angle (degrees) of a regular polygon with ${n} sides.`, a, [360 / n, a + 12, 180 - a / 2, 180 * (n - 2)], `(n−2)×180/n = ${a}°`); },
  triangle() { const a = ri(30, 80), b = ri(30, 70); return mc('quant', 'Geometry', `Two angles of a triangle are ${a}° and ${b}°. Find the third angle (degrees).`, 180 - a - b, [180 - a, 90 - b, 360 - a - b, a + b], `180 − ${a} − ${b} = ${180 - a - b}`); },
  ages() { const k = ri(2, 5), y = ri(4, 12) * 2, f1 = k * y; const n = ri(5, 10), age = f1 + n; return mc('quant', 'Ages', `A father is ${k} times as old as his son. The sum of their ages is ${(k + 1) * y} years. Find the father's age (years).`, k * y, [y, (k + 1) * y / 2, k * y + 5, k * y - 4], `Son = ${(k + 1) * y}/${k + 1} = ${y}; father = ${k} × ${y} = ${k * y}`); },
  mixture() { const a = ri(2, 5) * 10, p = pick([20, 30, 40]); const w = a * (100 - p) / 100; return mc('quant', 'Mixture', `A ${a}-litre mixture of milk and water contains ${p}% milk. How many litres of water are in it?`, w, [a * p / 100, w + 5, w - 4, a / 2], `Water = ${100 - p}% of ${a} = ${w} L`); },
  // ---------- reasoning ----------
  series() { const t = ri(0, 4); let s, ans, ex; const a = ri(2, 20);
    if (t === 0) { const d = ri(3, 9); s = [0, 1, 2, 3, 4].map(i => a + i * d); ans = a + 5 * d; ex = `Add ${d} each time`; }
    else if (t === 1) { const r = ri(2, 4); s = [0, 1, 2, 3, 4].map(i => (a % 5 + 1) * r ** i); ans = (a % 5 + 1) * r ** 5; ex = `Multiply by ${r} each time`; }
    else if (t === 2) { const st = ri(1, 6); s = [1, 2, 3, 4, 5].map(i => (i + st) ** 2); ans = (6 + st) ** 2; ex = `Squares of consecutive numbers starting ${st + 1}`; }
    else if (t === 3) { const d = ri(1, 4); s = [0, 1, 2, 3, 4].map(i => a + (i * (i + 1) / 2) * d); ans = a + 15 * d; ex = `Differences grow by ${d}: ${d}, ${2 * d}, ${3 * d}…`; }
    else { s = [1, 2, 3, 4, 5].map(i => i * i * i + ri(0, 0)); ans = 216; ex = 'Cubes of 1,2,3…'; }
    return mc('reasoning', 'Number Series', `Find the next term: ${s.join(', ')}, ?`, ans, [ans + 2, ans - 3, ans + 10, ans * 2 - s[4]], ex); },
  coding() { const k = ri(1, 4), w = pick(['MOON', 'LAMP', 'BOOK', 'FARM', 'PINK', 'TIME', 'RAIN', 'DESK']), w2 = pick(['CAKE', 'WIND', 'GOLD', 'HAND', 'SEAT']); const sh = (s, n) => [...s].map(c => String.fromCharCode((c.charCodeAt(0) - 65 + n + 26) % 26 + 65)).join(''); const ans = sh(w2, k);
    return mc('reasoning', 'Coding-Decoding', `If ${w} is coded as ${sh(w, k)}, how will ${w2} be coded?`, ans, [sh(w2, k + 1), sh(w2, k - 1), sh(w2, -k), sh(w2, k + 2)], `Each letter is shifted ${k} place(s) forward`, String); },
  direction() {
    const T = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15]], t = pick(T), k = pick([1, 1, 2]), a = t[0] * k, b = t[1] * k, h = t[2] * k;
    const D = [['north', [0, 1]], ['east', [1, 0]], ['south', [0, -1]], ['west', [-1, 0]]], d0 = pick(D), turn = pick(['left', 'right']);
    const i0 = D.indexOf(d0), d1 = D[(i0 + (turn === 'right' ? 1 : 3)) % 4];
    const x = d0[1][0] * a + d1[1][0] * b, y = d0[1][1] * a + d1[1][1] * b;
    const name = (y > 0 ? 'North' : y < 0 ? 'South' : '') + (y && x ? '-' : '') + (x > 0 ? 'East' : x < 0 ? 'West' : '');
    const text = `A man walks ${a} km ${d0[0]}, turns ${turn} and walks ${b} km.`;
    if (Math.random() < 0.5) return mc('reasoning', 'Direction Sense', `${text} How far is he from the starting point (km)?`, h, [a + b, h + 1, h - 1, Math.abs(a - b)], `Perpendicular legs: √(${a}² + ${b}²) = ${h}`);
    const all = ['North-East', 'North-West', 'South-East', 'South-West'];
    return mc('reasoning', 'Direction Sense', `${text} In which direction is he from the starting point?`, name, all.filter(z => z !== name), `${d0[0]} then ${d1[0]} puts him to the ${name} of the start`, String);
  },
  rank() { const n = ri(30, 60), r = ri(5, 20); return mc('reasoning', 'Ranking', `${nm()} ranks ${r}th from the top in a class of ${n}. What is the rank from the bottom?`, n - r + 1, [n - r, n - r + 2, n + r, n - r - 1], `Bottom rank = ${n} − ${r} + 1 = ${n - r + 1}`); },
  alphabet() {
    const t = ri(0, 3), L = n => String.fromCharCode(64 + n), p = ri(5, 22), q = ri(p + 3, 25);
    if (t === 0) return mc('reasoning', 'Alphabet', `Which letter is the opposite of ${L(p)} in the English alphabet (A↔Z, B↔Y ...)?`, L(27 - p), [L(p + 1), L(26 - p), L(27 - p + 1), L(p - 1)].filter(z => z !== L(27 - p) && z.charCodeAt(0) >= 65 && z.charCodeAt(0) <= 90), `Opposite letter = 27 − ${p} = ${27 - p} = ${L(27 - p)}`, String);
    if (t === 1) return mc('reasoning', 'Alphabet', `How many letters lie between ${L(p)} and ${L(q)} in the English alphabet?`, q - p - 1, [q - p, q - p + 1, q - p - 2, p], `${q} − ${p} − 1 = ${q - p - 1}`);
    if (t === 2) { const n = ri(2, Math.min(6, p - 1)); return mc('reasoning', 'Alphabet', `Which letter is ${ord(n)} to the left of ${L(p)}?`, L(p - n), [L(p - n + 1), L(p - n - 1), L(p + n), L(p - n + 2)], `${p} − ${n} = ${p - n} = ${L(p - n)}`, String); }
    return mc('reasoning', 'Alphabet', `Which letter is ${ord(p)} from the right end of the English alphabet?`, L(27 - p), [L(p), L(26 - p), L(28 - p), L(27 - p + 2)].filter(z => z !== L(27 - p) && z.charCodeAt(0) >= 65 && z.charCodeAt(0) <= 90), `Position from the left = 27 − ${p} = ${27 - p} = ${L(27 - p)}`, String);
  },
  calendar() { const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], s = ri(0, 6), g = ri(8, 40); const ans = days[(s + g) % 7]; return mc('reasoning', 'Calendar', `If today is ${days[s]}, what day will it be after ${g} days?`, ans, [days[(s + g + 1) % 7], days[(s + g + 6) % 7], days[(s + g + 2) % 7], days[(s + g + 3) % 7]], `${g} mod 7 = ${g % 7}, so ${days[s]} + ${g % 7} = ${ans}`, String); },
  clock() { const h = ri(1, 11), m = pick([0, 10, 20, 30, 40, 50]); let a = Math.abs(30 * h - 5.5 * m); if (a > 180) a = 360 - a; return mc('reasoning', 'Clock', `Find the angle (degrees) between the hands of a clock at ${h}:${String(m).padStart(2, '0')}.`, a, [a + 15, Math.abs(a - 30), 360 - a, a + 30], `|30h − 5.5m| = |${30 * h} − ${5.5 * m}| = ${a}°`); },
  oddout() { const t = ri(0, 2); if (t === 0) { const pr = shuffle([2, 3, 5, 7, 11, 13, 17, 19, 23]).slice(0, 3), od = pick([9, 15, 21, 25, 27]); const o = shuffle([...pr, od]); return mc('reasoning', 'Odd One Out', `Find the odd one out: ${o.join(', ')}`, od, o.filter(x => x !== od), `${od} is composite; others are prime`, String); }
    if (t === 1) { const sq = shuffle([4, 9, 16, 25, 36, 49, 64, 81]).slice(0, 3), od = pick([12, 20, 30, 50, 70]); const o = shuffle([...sq, od]); return mc('reasoning', 'Odd One Out', `Find the odd one out: ${o.join(', ')}`, od, o.filter(x => x !== od), `${od} is not a perfect square`, String); }
    const ev = shuffle([12, 18, 24, 30, 42, 54]).slice(0, 3), od = pick([15, 21, 27, 33]); const o = shuffle([...ev, od]); return mc('reasoning', 'Odd One Out', `Find the odd one out: ${o.join(', ')}`, od, o.filter(x => x !== od), `${od} is odd; the rest are even`, String); },
  analogy() { const e = pick([[2, 'square', n => n * n], [3, 'cube', n => n ** 3], [2, 'double', n => n * 2], [3, 'triple', n => n * 3]]); const a = ri(2, 7), b = ri(8, 12); const g = e[2]; return mc('reasoning', 'Analogy', `${a} : ${g(a)} :: ${b} : ?`, g(b), [g(b) + b, g(b) - b, g(b) + 2, g(b) * 2 - g(a)], `The second number is the ${e[1]} of the first`); },
  symbols() { const a = ri(4, 12), b = ri(2, 6), c = ri(2, 9); return mc('reasoning', 'Mathematical Operations', `If '+' means '×', '×' means '−', '−' means '÷' and '÷' means '+', find: ${a} + ${b} × ${c} − ${b}`, a * b - c / b, [a + b - c - b, a * b - c, a * b + c, a - b], `Replace symbols: ${a} × ${b} − ${c} ÷ ${b} = ${a * b} − ${f(c / b)} = ${f(a * b - c / b)}`); },
  blood() {
    const T = [
      ['Pointing to a man, a woman says "He is the son of my mother\'s only brother." How is the man related to the woman?', 'Cousin', ['Brother', 'Uncle', 'Nephew'], "Mother's brother's son is a maternal cousin"],
      ['A is the brother of B. B is the sister of C. C is the father of D. How is A related to D?', 'Uncle', ['Father', 'Brother', 'Cousin'], "A is C's brother, so D's uncle"],
      ["Pointing to a girl, Raj says: \"She is the daughter of my father's only son.\" How is the girl related to Raj?", 'Daughter', ['Sister', 'Niece', 'Cousin'], "Father's only son is Raj himself"],
      ['X is the father of Y. Y is the sister of Z. Z is the mother of W. How is X related to W?', 'Grandfather', ['Father', 'Uncle', 'Brother'], "X is Z's father, so W's grandfather"],
      ['A is the father of B. B is the sister of C. C is the son of D. How is D related to A?', 'Wife', ['Sister', 'Mother', 'Daughter'], 'B and C are children of A and D, so D is the wife of A'],
      ["A's mother is B's sister. How is A related to B?", 'Nephew or niece', ['Brother or sister', 'Son or daughter', 'Cousin'], "A is the child of B's sister"],
      ['X is the mother of Y. Y is the sister of Z. Z is the father of W. How is X related to W?', 'Grandmother', ['Mother', 'Aunt', 'Sister'], "X is Z's mother, so W's grandmother"],
      ['Pointing to a photograph, Rita says "He is the son of my mother\'s only son." Whose photograph is it?', 'Her nephew', ['Her brother', 'Her son', 'Her uncle'], "Mother's only son is Rita's brother; his son is her nephew"],
      ['A is B\'s brother. C is A\'s mother. D is C\'s father. How is B related to D?', 'Grandchild', ['Child', 'Nephew', 'Brother'], "D is the father of B's mother, so B is D's grandchild"],
      ["If P is the brother of Q and Q is the sister of R, how is R related to P?", 'Brother or sister', ['Cousin', 'Uncle', 'Son'], 'P and R are both siblings of Q']];
    const t = pick(T); return mc('reasoning', 'Blood Relations', t[0], t[1], t[2], t[3], String);
  },
  syllogism() { const t = pick([['All pens are books. All books are tables.', 'All pens are tables.', 'Yes'], ['Some cats are dogs. All dogs are birds.', 'Some cats are birds.', 'Yes'], ['All roses are flowers. Some flowers are red.', 'Some roses are red.', 'No'], ['No fish is a bird. All sparrows are birds.', 'No sparrow is a fish.', 'Yes']]); return mc('reasoning', 'Syllogism', `Statements: ${t[0]}\nConclusion: ${t[1]}\nDoes the conclusion definitely follow?`, t[2] === 'Yes' ? 'Follows' : 'Does not follow', ['Cannot say', t[2] === 'Yes' ? 'Does not follow' : 'Follows', 'Only possible'].filter(x => x), t[2] === 'Yes' ? 'It follows directly from the statements' : 'Not enough information to conclude it definitely', String); }
};
const QUANT = ['percent', 'percentChange', 'profit', 'loss', 'discount', 'ratio', 'si', 'ci', 'work', 'speed', 'avgSpeed', 'average', 'hcf', 'circle', 'rect', 'cyl', 'simplify', 'algebra', 'algebra2', 'trig', 'geometry', 'triangle', 'ages', 'mixture'];
const REAS = ['series', 'coding', 'direction', 'rank', 'calendar', 'clock', 'oddout', 'analogy', 'symbols', 'blood', 'syllogism', 'alphabet'];
let MAP = null;
function topicMap() {
  if (MAP) return MAP; MAP = { quant: {}, reasoning: {} };
  for (const [sec, keys] of [['quant', QUANT], ['reasoning', REAS]]) for (const k of keys) { try { const t = Q[k]().t; (MAP[sec][t] ||= []).push(k); } catch { } }
  return MAP;
}
export const genTopics = sec => Object.keys(topicMap()[sec] || {});
export function genQuestions(sec, n, topic) {
  const keys = topic ? (topicMap()[sec] || {})[topic] || [] : sec === 'quant' ? QUANT : sec === 'reasoning' ? REAS : [];
  if (!keys.length) return [];
  const out = [], seen = new Set(); let guard = 0;
  while (out.length < n && guard++ < n * 10) {
    let q; try { q = Q[keys[Math.random() * keys.length | 0]](); } catch { continue; }
    if (!q || seen.has(q.q) || new Set(q.o).size < 4) continue; seen.add(q.q); out.push(q);
  }
  return out;
}

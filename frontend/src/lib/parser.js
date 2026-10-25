// Local rule-based parser (same logic as the old index.html).
// Later you can replace it with the backend's extraction result.
import { todayISO, yesterdayISO } from './format';

const NUMWORDS = { ek: 1, do: 2, teen: 3, chaar: 4, paanch: 5, che: 6, saat: 7, aath: 8, nau: 9, das: 10, bees: 20, pachaas: 50, sau: 100, hazar: 1000, hazaar: 1000 };
const IN_WORDS = /bikri|becha|bechi|sold|sale|aaya|mil[ae]|receive|vasool|ਵਿਕਰੀ|बिक्री|बेच/;
const OUT_WORDS = /khareed|kharid|liye|purchase|paid|pay|diya|diye|gaya|ਦਿੱਤਾ|ਖਰੀਦ|खरीद|दिया|लिया/;
const NATURE_MAP = [
  [/kiray|rent|ਕਿਰਾਇਆ|किराय/, 'Rent'],
  [/bijli|electric|current|ਬਿਜਲੀ|बिजली/, 'Electricity'],
  [/mazdoor|wage|labour|ਮਜ਼ਦੂਰੀ|मज़दूरी/, 'Wages'],
  [/maal|samaan|purchase|khareed|ਖਰੀਦ|खरीद|सामान/, 'Purchases'],
  [/bech|bikri|sale|ਵਿਕਰੀ|बिक्री|बेच/, 'Sales'],
];

export function parseEntry(text, parties = []) {
  const raw = text;
  const t = text.toLowerCase();
  let amount = null;
  const m = t.match(/(\d+(?:\.\d+)?)\s*(k|hazar|hazaar|thousand|lakh|lac|lacs)?/);
  if (m) {
    amount = parseFloat(m[1]);
    const u = m[2];
    if (u && ['k', 'hazar', 'hazaar', 'thousand'].includes(u)) amount *= 1000;
    if (u && ['lakh', 'lac', 'lacs'].includes(u)) amount *= 100000;
  } else {
    const w = t.match(/\b(ek|do|teen|chaar|paanch|das|bees|pachaas|sau|hazar|hazaar)\b/);
    if (w) amount = NUMWORDS[w[1]] || null;
  }

  let dir = null;
  if (IN_WORDS.test(t) && !OUT_WORDS.test(t)) dir = 'in';
  else if (OUT_WORDS.test(t) && !IN_WORDS.test(t)) dir = 'out';

  let nature = 'Other';
  for (const [rx, n] of NATURE_MAP) if (rx.test(t)) { nature = n; break; }
  if (nature === 'Other') nature = dir === 'in' ? 'Sales' : dir === 'out' ? 'Purchases' : 'Other';

  let party = '';
  const known = parties.map((p) => p.n.toLowerCase());
  const words = t.replace(/[.,?!]/g, '').split(/\s+/);
  const rawWords = raw.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const cap = /^[A-Z]/.test(rawWords[i] || '');
    if (known.includes(words[i])) { party = parties[known.indexOf(words[i])].n; break; }
    if (cap && words[i].length > 2 && !NUMWORDS[words[i]]) { party = rawWords[i]; break; }
    if (['ko', 'se', 'from', 'to'].includes(words[i]) && words[i + 1] && /^[A-Z]/.test(rawWords[i + 1] || '')) { party = rawWords[i + 1]; break; }
  }

  const date = /\bkal\b|yesterday|ਕਲ/.test(t) ? yesterdayISO() : todayISO();
  const flags = [];
  if (!amount) flags.push('Missing amount');
  if (!dir) flags.push('Unclear direction');
  if (!party && (nature === 'Sales' || nature === 'Purchases')) flags.push('Missing customer name');

  let conf = 0.5;
  if (amount) conf += 0.2;
  if (dir) conf += 0.15;
  if (party) conf += 0.15;
  conf = Math.min(0.99, conf - flags.length * 0.04);

  const lines = [];
  if (amount && dir) {
    if (dir === 'in') lines.push({ a: 'Cash', d: amount, c: 0 }, { a: nature, d: 0, c: amount });
    else lines.push({ a: nature === 'Other' ? 'Purchases' : nature, d: amount, c: 0 }, { a: 'Cash', d: 0, c: amount });
  }
  return { raw, amount, dir, nature, party, date, flags, conf: +conf.toFixed(2), lines };
}

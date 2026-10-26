// Voice question and answer helpers for the assistant
import { speak } from './speech';

export const hasSTT = () =>
  typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// listen once, resolve with the transcript ('' if nothing heard)
export function listenOnce(lang, ms = 7000) {
  return new Promise((resolve) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return resolve('');
    const r = new SR();
    r.lang = lang; r.interimResults = false; r.maxAlternatives = 1;
    let done = false;
    const fin = (v) => { if (done) return; done = true; clearTimeout(tm); try { r.stop(); } catch (e) {} resolve(v || ''); };
    const tm = setTimeout(() => fin(''), ms);
    r.onresult = (e) => fin(e.results[0][0].transcript);
    r.onerror = () => fin('');
    r.onend = () => fin('');
    try { r.start(); } catch (e) { fin(''); }
  });
}

export const speakAsync = (text, lang) => new Promise((res) => { if (!speak(text, lang, res)) res(); });

const YES = /\b(yes|yeah|yep|ok|okay|correct|right|haan|han|haa|ji|sahi|theek|thik|bilkul)\b|हाँ|हां|जी|सही|ठीक|ਹਾਂ|ਜੀ|ਸਹੀ|ਠੀਕ/i;
const NO = /\b(no|nope|nahi|nahin|na|galat|wrong|cancel)\b|नहीं|नही|गलत|ਨਹੀਂ|ਨਹੀ|ਗਲਤ/i;
export function yesNo(s) {
  if (NO.test(s)) return false;
  if (YES.test(s)) return true;
  return null;
}

const IN = /mile|mila|mili|aaya|aaye|received|receive|becha|sold|मिले|मिला|आया|आए|बेचा|ਮਿਲੇ|ਮਿਲਿਆ|ਆਏ/i;
const OUT = /diya|diye|paid|pay|gaya|gaye|kharch|दिया|दिए|गया|गए|खर्च|ਦਿੱਤਾ|ਦਿੱਤੇ|ਗਏ/i;
export function dirFrom(s) {
  const a = IN.test(s), b = OUT.test(s);
  return a && !b ? 'in' : b && !a ? 'out' : null;
}

export const Q = {
  en: { amount: 'How much money?', dir: 'Did you receive money, or pay money?', party: 'Who is the party?' },
  hi: { amount: 'कितने रुपये?', dir: 'पैसे मिले या दिए?', party: 'किस पार्टी से या को?' },
  pa: { amount: 'ਕਿੰਨੇ ਰੁਪਏ?', dir: 'ਪੈਸੇ ਮਿਲੇ ਜਾਂ ਦਿੱਤੇ?', party: 'ਕਿਸ ਪਾਰਟੀ ਨਾਲ?' },
  hing: { amount: 'Kitne rupaye?', dir: 'Paise mile ya diye?', party: 'Kis party se ya ko?' },
};

// Text-to-speech (assistant reads things aloud) using the browser / Android WebView engine.
const hasTTS = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text, lang = 'en-IN', onEnd) {
  if (!hasTTS()) { onEnd && onEnd(); return false; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.92;
  // use a matching voice if the device has one
  const v = window.speechSynthesis.getVoices().find((x) => x.lang === lang) ||
            window.speechSynthesis.getVoices().find((x) => x.lang.startsWith(lang.slice(0, 2)));
  if (v) u.voice = v;
  u.onend = () => onEnd && onEnd();
  u.onerror = () => onEnd && onEnd();
  window.speechSynthesis.speak(u);
  return true;
}
export const stopSpeaking = () => hasTTS() && window.speechSynthesis.cancel();

const rupees = (n) => Math.round(n || 0).toLocaleString('en-IN');

// What the assistant says for one entry, per UI language.
export function describeEntry(e, lang) {
  const amt = rupees(e.amount);
  const party = e.party || '';
  const incoming = e.dir === 'in';
  if (!e.amount || !e.dir) {
    return {
      en: 'This entry is not clear. The amount or direction is missing. Please edit it.',
      hi: 'यह एंट्री साफ़ नहीं है। रकम या दिशा नहीं मिली। कृपया इसे बदलें।',
      pa: 'ਇਹ ਐਂਟਰੀ ਸਾਫ਼ ਨਹੀਂ ਹੈ। ਰਕਮ ਜਾਂ ਦਿਸ਼ਾ ਨਹੀਂ ਮਿਲੀ। ਕਿਰਪਾ ਕਰਕੇ ਸੋਧੋ।',
      hing: 'Yeh entry saaf nahi hai. Rakam ya disha nahi mili. Kripya edit karein.',
    }[lang];
  }
  const who = {
    en: party ? (incoming ? ` from ${party}` : ` to ${party}`) : '',
    hi: party ? (incoming ? ` ${party} से` : ` ${party} को`) : '',
    pa: party ? (incoming ? ` ${party} ਤੋਂ` : ` ${party} ਨੂੰ`) : '',
    hing: party ? (incoming ? ` ${party} se` : ` ${party} ko`) : '',
  }[lang];
  const line = {
    en: `${incoming ? 'Received' : 'Paid'} ${amt} rupees${who}, for ${e.nature}.`,
    hi: `${who} ${amt} रुपये ${incoming ? 'मिले' : 'दिए'}, ${e.nature} के लिए।`,
    pa: `${who} ${amt} ਰੁਪਏ ${incoming ? 'ਮਿਲੇ' : 'ਦਿੱਤੇ'}, ${e.nature} ਲਈ।`,
    hing: `${who} ${amt} rupaye ${incoming ? 'mile' : 'diye'}, ${e.nature} ke liye.`,
  }[lang];
  return line.trim();
}

export function describeSummary(s, lang) {
  const f = rupees;
  return {
    en: `Today you received ${f(s.inAmt)} rupees and paid ${f(s.outAmt)} rupees. Cash balance is ${f(s.cash)} rupees. ${s.pending} entries are waiting for review.`,
    hi: `आज आपके ${f(s.inAmt)} रुपये आए और ${f(s.outAmt)} रुपये गए। नकद शेष ${f(s.cash)} रुपये है। ${s.pending} एंट्रियाँ समीक्षा के लिए बाकी हैं।`,
    pa: `ਅੱਜ ਤੁਹਾਡੇ ${f(s.inAmt)} ਰੁਪਏ ਆਏ ਅਤੇ ${f(s.outAmt)} ਰੁਪਏ ਗਏ। ਨਕਦ ਬਕਾਇਆ ${f(s.cash)} ਰੁਪਏ ਹੈ। ${s.pending} ਐਂਟਰੀਆਂ ਸਮੀਖਿਆ ਲਈ ਬਾਕੀ ਹਨ।`,
    hing: `Aaj aapke ${f(s.inAmt)} rupaye aaye aur ${f(s.outAmt)} rupaye gaye. Cash balance ${f(s.cash)} rupaye hai. ${s.pending} entries review ke liye baaki hain.`,
  }[lang];
}

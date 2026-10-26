// Voice input pipeline:
//   1. record audio (MediaRecorder) and show a live waveform
//   2. POST it to  {API_BASE}/voice  -> { text }   (server tries Bhashini first, then Sarvam)
//   3. if that fails / no API yet -> fall back to the browser Web Speech API transcript
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export async function transcribeViaApi(blob, lang) {
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_BASE not set');
  const fd = new FormData();
  fd.append('audio', blob, 'clip.webm');
  fd.append('language', lang); // e.g. hi-IN, pa-IN, en-IN
  const r = await fetch(`${API_BASE}/voice`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('voice api ' + r.status);
  const j = await r.json();
  if (!j.text) throw new Error('empty transcript');
  return j.text;
}

export function createRecorder(lang, onLevels) {
  let stream, rec, ctx, raf, recog;
  let chunks = [];
  let webText = '';

  const cleanup = () => {
    cancelAnimationFrame(raf);
    stream && stream.getTracks().forEach((t) => t.stop());
    ctx && ctx.close && ctx.close();
    onLevels && onLevels(null);
  };

  return {
    async start() {
      if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('no mic');
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // waveform
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        onLevels && onLevels(data);
        raf = requestAnimationFrame(tick);
      };
      tick();

      // recording
      chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.start();

      // Web Speech fallback runs in parallel (works in Chrome, not in Android WebView)
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      webText = '';
      if (SR) {
        try {
          recog = new SR();
          recog.lang = lang;
          recog.interimResults = true;
          recog.onresult = (ev) => { webText = [...ev.results].map((r) => r[0].transcript).join(''); };
          recog.onerror = () => {};
          recog.start();
        } catch (e) { recog = null; }
      }
    },

    // resolves to { text, source: 'api' | 'webspeech' | 'none' }
    stop() {
      return new Promise((resolve) => {
        if (recog) { try { recog.stop(); } catch (e) {} }
        rec.onstop = async () => {
          cleanup();
          const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
          try {
            const text = await transcribeViaApi(blob, lang);
            resolve({ text, source: 'api' });
          } catch (e) {
            setTimeout(() => resolve({ text: webText, source: webText ? 'webspeech' : 'none' }), 300);
          }
        };
        try { rec.stop(); } catch (e) { cleanup(); resolve({ text: '', source: 'none' }); }
      });
    },
  };
}

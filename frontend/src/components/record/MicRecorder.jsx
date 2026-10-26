'use client';
import { useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { createRecorder } from '@/lib/voice';
import Waveform from './Waveform';
import LiveUnderstanding from './LiveUnderstanding';

const VOICE_LANGS = [['en-IN', 'English'], ['hi-IN', 'हिन्दी'], ['pa-IN', 'ਪੰਜਾਬੀ']];

// Hold the mic -> record -> /voice -> text. onText(text) is called with the transcript.
export default function MicRecorder({ onText, onUnavailable }) {
  const { S, t, setVoiceLang, toast } = useApp();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [levels, setLevels] = useState(null);
  const [status, setStatus] = useState('');
  const [live, setLive] = useState('');
  const recRef = useRef(null);

  const start = async (e) => {
    e.preventDefault();
    if (recording || busy) return;
    try {
      setLive('');
      recRef.current = createRecorder(S.voiceLang, setLevels, setLive);
      await recRef.current.start();
      setRecording(true);
      setStatus(t('rec_listening'));
    } catch (err) {
      setStatus(t('rec_nomic'));
      toast(t('rec_nomic'));
      onUnavailable && onUnavailable(); // no mic / permission denied -> switch to typing
    }
  };

  const stop = async () => {
    if (!recording) return;
    setRecording(false);
    setBusy(true);
    setStatus(t('rec_processing'));
    const { text } = await recRef.current.stop();
    setBusy(false);
    setLevels(null);
    setStatus('');
    setLive('');
    if (text) onText(text);
    else toast(t('rec_nomic'));
  };

  return (
    <div className="card miczone">
      <button
        className={'mic' + (recording ? ' rec' : '')}
        title="Hold to talk"
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        disabled={busy}
      >
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" /></svg>
      </button>
      <Waveform levels={levels} live={recording} />
      <div className="recstate" id="recState">{status || t('rec_hold')}</div>

      {/* words appear live and turn into chips */}
      {recording && <LiveUnderstanding text={live} />}

      <div className="row" style={{ justifyContent: 'center', marginTop: '.5rem' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 700 }}>{t('rec_voicelang')}</span>
        <div className="seg">
          {VOICE_LANGS.map(([code, label]) => (
            <button key={code} className={S.voiceLang === code ? 'on' : ''} onClick={() => setVoiceLang(code)}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

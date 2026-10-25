'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { parseEntry } from '@/lib/parser';
import { fmt } from '@/lib/format';
import { speak } from '@/lib/speech';
import MicRecorder from './MicRecorder';
import TextEntry from './TextEntry';
import TAccount from './TAccount';

export default function RecordView({ goReview }) {
  const { S, t, addEntry, toast } = useApp();
  const [heard, setHeard] = useState(null); // transcript waiting for confirmation
  const [mode, setMode] = useState('voice'); // 'voice' | 'text'  (text = alternative to voice)

  const preview = heard && parseEntry(heard, S.parties);

  const confirm = () => { addEntry(heard); setHeard(null); toast(t('offline_none')); goReview && goReview(); };

  return (
    <section>
      <h1>{t('rec_title')}</h1>
      <p className="sub">{t('rec_sub')}</p>

      {/* choose how to enter: voice or typing */}
      <div className="modetoggle">
        <button className={mode === 'voice' ? 'on' : ''} onClick={() => setMode('voice')}>{t('mode_voice')}</button>
        <button className={mode === 'text' ? 'on' : ''} onClick={() => setMode('text')}>{t('mode_text')}</button>
      </div>

      {mode === 'voice' && <MicRecorder onText={setHeard} onUnavailable={() => setMode('text')} />}

      {heard && (
        <div className="card" style={{ borderLeft: '5px solid var(--gold)' }}>
          <b>{t('rec_heard')}</b> <span style={{ fontStyle: 'italic' }}>“{heard}” → {fmt(preview.amount || 0)} {preview.dir === 'in' ? '⬇' : '⬆'} {preview.party || '—'} · {preview.nature}</span>
          <TAccount lines={preview.lines} />
          <div className="row" style={{ marginTop: '.6rem' }}>
            <button className="btn sm soft" onClick={() => speak(heard, S.voiceLang)}>{t('rec_play')}</button>
            <button className="btn sm orange" onClick={() => setHeard(null)}>{t('rec_retry')}</button>
            <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={confirm}>{t('rec_ok')}</button>
          </div>
        </div>
      )}

      {/* typed entries go straight to Review */}
      {mode === 'text' && <TextEntry onText={(txt) => { addEntry(txt); toast(t('offline_none')); }} />}
    </section>
  );
}

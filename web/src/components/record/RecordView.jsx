'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { parseEntry } from '@/lib/parser';
import { fmt } from '@/lib/format';
import { speak } from '@/lib/speech';
import MicRecorder from './MicRecorder';
import TextEntry from './TextEntry';

export default function RecordView({ goReview }) {
  const { S, t, addEntry, toast } = useApp();
  const [heard, setHeard] = useState(null); // transcript waiting for confirmation

  const preview = heard && parseEntry(heard, S.parties);

  const confirm = () => { addEntry(heard); setHeard(null); toast(t('offline_none')); goReview && goReview(); };

  return (
    <section>
      <h1>{t('rec_title')}</h1>
      <p className="sub">{t('rec_sub')}</p>

      <MicRecorder onText={setHeard} />

      {heard && (
        <div className="card" style={{ borderLeft: '5px solid var(--gold)' }}>
          <b>{t('rec_heard')}</b> <span style={{ fontStyle: 'italic' }}>“{heard}” → {fmt(preview.amount || 0)} {preview.dir === 'in' ? '⬇' : '⬆'} {preview.party || '—'} · {preview.nature}</span>
          <div className="row" style={{ marginTop: '.6rem' }}>
            <button className="btn sm soft" onClick={() => speak(heard, S.voiceLang)}>{t('rec_play')}</button>
            <button className="btn sm orange" onClick={() => setHeard(null)}>{t('rec_retry')}</button>
            <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={confirm}>{t('rec_ok')}</button>
          </div>
        </div>
      )}

      {/* text input as an alternative: goes straight to Review */}
      <TextEntry onText={(txt) => { addEntry(txt); toast(t('offline_none')); }} />
    </section>
  );
}

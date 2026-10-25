'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import LiveUnderstanding from './LiveUnderstanding';

const SAMPLES = ['aaj Ramu ko 5000 ka maal becha', 'kal 2 hazar kiraya diya', '3.5k bijli ka bill pay kiya', '1.2 lakh Sharma Traders ko payment ki', 'aaj 1500 mazdoori di'];

// Text input as an alternative to voice
export default function TextEntry({ onText }) {
  const { t } = useApp();
  const [val, setVal] = useState('');
  const submit = () => {
    const v = val.trim();
    if (!v) return;
    onText(v);
    setVal('');
  };
  return (
    <div className="card">
      <div className="row">
        <input className="grow" value={val} placeholder={t('rec_ph')}
          onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <button className="btn" onClick={submit}>{t('rec_add')}</button>
      </div>

      {/* understands the sentence while you type */}
      <LiveUnderstanding text={val} />

      <div className="chips" style={{ marginTop: '.8rem' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 700, width: '100%' }}>{t('rec_samples')}</span>
        {SAMPLES.map((s) => <button key={s} className="chip" onClick={() => setVal(s)}>{s}</button>)}
      </div>
    </div>
  );
}

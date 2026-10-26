'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import { fmt } from '@/lib/format';
import { speak, stopSpeaking, describeSummary } from '@/lib/speech';
import ShareReport from '@/components/share/ShareReport';
import { buildSummaryText } from '@/lib/report';

export default function DailySummary({ open, onClose }) {
  const { S, summary: s, t, lang, speechLang } = useApp();
  const [speaking, setSpeaking] = useState(false);
  const [sharing, setSharing] = useState(false);

  const close = () => { stopSpeaking(); setSpeaking(false); onClose(); };
  const toggle = () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    setSpeaking(true);
    speak(describeSummary(s, lang), speechLang, () => setSpeaking(false));
  };

  const cards = [
    [t('sum_in'), fmt(s.inAmt), 'var(--green2)'],
    [t('sum_out'), fmt(s.outAmt), 'var(--orange)'],
    [t('sum_net'), fmt(s.net), s.net >= 0 ? 'var(--green2)' : 'var(--red)'],
    [t('sum_cash'), fmt(s.cash), 'var(--text)'],
    [t('sum_entries'), s.count, 'var(--text)'],
    [t('sum_pending'), s.pending, s.pending ? 'var(--orange)' : 'var(--text)'],
  ];

  return (
    <Modal open={open} onClose={close}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>📊 {t('sum_title')}</h3>
        <button className="btn sm soft" onClick={close}>{t('as_close')}</button>
      </div>
      <div className="statgrid">
        {cards.map(([l, v, c]) => (
          <div className="stat" key={l}><div className="v" style={{ color: c }}>{v}</div><div className="l">{l}</div></div>
        ))}
      </div>
      <button className="btn big" style={{ width: '100%' }} onClick={toggle}>{speaking ? t('sum_stop') : t('sum_listen')}</button>
      <button className="btn big gold" style={{ width: '100%', marginTop: '.6rem' }} onClick={() => setSharing(true)}>{t('share_report')}</button>
      <ShareReport open={sharing} onClose={() => setSharing(false)} title={t('share_daily')} text={buildSummaryText({ biz: S.biz.name, s, t })} />
    </Modal>
  );
}

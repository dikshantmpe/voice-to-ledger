'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import TickCross from './TickCross';
import { speak, stopSpeaking, describeEntry } from '@/lib/speech';
import { fmt } from '@/lib/format';

// Walks through pending entries one by one: speaks the entry, user taps ✔ or ✘.
export default function AssistantMode({ open, onClose }) {
  const { S, t, lang, speechLang, approve, reject } = useApp();
  const [queue, setQueue] = useState([]);
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const started = useRef(false);

  // snapshot the pending ids when the assistant opens
  useEffect(() => {
    if (open) {
      setQueue(S.entries.filter((e) => e.status === 'pending').map((e) => e.id));
      setI(0);
      started.current = true;
    } else {
      stopSpeaking();
      started.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const entry = S.entries.find((e) => e.id === queue[i]);
  const done = open && started.current && !entry;

  const say = () => {
    if (!entry) return;
    speak(`${describeEntry(entry, lang)} ${t('as_correct')}`, speechLang);
  };

  // read each new entry aloud
  useEffect(() => {
    if (open && entry && auto) say();
    if (open && done) speak(t('as_done'), speechLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i, queue, lang]);

  const answer = (yes) => {
    if (!entry) return;
    yes ? approve(entry.id) : reject(entry.id);
    setI((n) => n + 1);
  };
  const close = () => { stopSpeaking(); onClose(); };

  return (
    <Modal open={open} onClose={close}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>🗣 {t('as_title')}</h3>
        <button className="btn sm soft" onClick={close}>{t('as_close')}</button>
      </div>

      {done || !entry ? (
        <div className="empty" style={{ padding: '2rem 0' }}>✦ {t('as_done')}</div>
      ) : (
        <>
          <p className="kv" style={{ margin: '.8rem 0' }}>{i + 1} {t('as_of')} {queue.length}</p>
          <div className="as-card">
            <div className="as-amt">{entry.amount ? fmt(entry.amount) : '—'}</div>
            <div className={'tag ' + (entry.dir === 'in' ? 'in' : entry.dir === 'out' ? 'out' : 'flag')}>
              {entry.dir === 'in' ? t('in') : entry.dir === 'out' ? t('out') : t('unknown_dir')}
            </div>
            <div className="as-who">{entry.party || t('rev_noparty')} · {entry.nature}</div>
            <div className="phrase">“{entry.phrase}”</div>
            <div className="as-q">{t('as_correct')}</div>
          </div>

          <TickCross onYes={() => answer(true)} onNo={() => answer(false)} yesLabel={t('as_yes')} noLabel={t('as_no')} />

          <div className="row" style={{ justifyContent: 'space-between', marginTop: '1rem' }}>
            <button className="btn soft" onClick={say}>{t('as_replay')}</button>
            <label className="kv" style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> {t('as_autoread')}
            </label>
          </div>
          <p className="kv" style={{ marginTop: '.8rem' }}>{t('as_tip')}</p>
        </>
      )}
    </Modal>
  );
}

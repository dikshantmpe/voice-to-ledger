'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import TickCross from './TickCross';
import { speak, stopSpeaking, describeEntry } from '@/lib/speech';
import { speakAsync, listenOnce, hasSTT, yesNo, dirFrom, Q } from '@/lib/voiceqa';
import { parseEntry } from '@/lib/parser';
import { fmt } from '@/lib/format';

// Walks through pending entries one by one.
// Speaks the entry, then the user answers with ✔ / ✘ buttons OR by voice.
// If a field is missing the assistant asks for it ("How much money?") and fills it from the spoken answer.
export default function AssistantMode({ open, onClose }) {
  const { S, t, lang, speechLang, approve, reject, updateEntry, toast } = useApp();
  const [queue, setQueue] = useState([]);
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);        // bumps after a spoken answer so the next question is read
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (open) {
      setQueue(S.entries.filter((e) => e.status === 'pending').map((e) => e.id));
      setI(0); setHeard('');
      started.current = true;
    } else {
      stopSpeaking();
      started.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const entry = S.entries.find((e) => e.id === queue[i]);
  const done = open && started.current && !entry;

  // what is still missing on this entry?
  const missing = !entry ? null
    : !entry.amount ? 'amount'
    : !entry.dir ? 'dir'
    : (!entry.party && ['Sales', 'Purchases'].includes(entry.nature)) ? 'party'
    : null;

  const say = () => {
    if (!entry) return;
    speak(missing ? Q[lang][missing] : `${describeEntry(entry, lang)} ${t('as_correct')}`, speechLang);
  };

  useEffect(() => {
    if (open && entry && auto) say();
    if (open && done) speak(t('as_done'), speechLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i, queue, lang, tick]);

  const answer = (yes) => {
    if (!entry) return;
    yes ? approve(entry.id) : reject(entry.id);
    setHeard('');
    setI((n) => n + 1);
  };

  // ask the question aloud, listen, act on the answer
  const voiceAnswer = async () => {
    if (!entry || listening) return;
    setListening(true); setHeard('');
    await speakAsync(missing ? Q[lang][missing] : t('as_correct'), speechLang);
    const said = (await listenOnce(speechLang)).replace(/,/g, '').trim();
    setListening(false);
    setHeard(said);
    if (!said) { toast(t('as_nohear')); return; }

    if (!missing) {
      const yn = yesNo(said);
      if (yn === true) answer(true);
      else if (yn === false) answer(false);
      else toast(t('as_nohear'));
      return;
    }
    if (missing === 'amount') {
      const p = parseEntry(said, S.parties);
      if (p.amount) { updateEntry(entry.id, { amount: p.amount }); setTick((n) => n + 1); } else toast(t('as_nohear'));
    } else if (missing === 'dir') {
      const d = dirFrom(said);
      if (d) { updateEntry(entry.id, { dir: d }); setTick((n) => n + 1); } else toast(t('as_nohear'));
    } else if (missing === 'party') {
      const name = said.split(/\s+/).slice(0, 3).join(' ');
      updateEntry(entry.id, { party: name.charAt(0).toUpperCase() + name.slice(1) });
      setTick((n) => n + 1);
    }
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
            <div className="as-q">{missing ? Q[lang][missing] : t('as_correct')}</div>
          </div>

          {hasSTT() && (
            <button className={'btn big as-voice' + (listening ? ' on' : '')} style={{ width: '100%', marginBottom: '.8rem' }} onClick={voiceAnswer} disabled={listening}>
              {listening ? '🎙 ' + t('as_listening') : t('as_voice')}
            </button>
          )}
          {heard && <div className="kv" style={{ textAlign: 'center', marginBottom: '.6rem' }}>{t('as_heard')}: “{heard}”</div>}

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

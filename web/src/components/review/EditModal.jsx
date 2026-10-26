'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';

export default function EditModal({ entry, onClose }) {
  const { S, t, updateEntry } = useApp();
  const [f, setF] = useState(null);
  useEffect(() => { if (entry) setF({ party: entry.party, amount: entry.amount ?? '', dir: entry.dir || '', nature: entry.nature, date: entry.date }); }, [entry]);
  if (!entry || !f) return null;
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });
  const save = () => { updateEntry(entry.id, { ...f, amount: +f.amount || null, dir: f.dir || null }); onClose(); };
  return (
    <Modal open onClose={onClose}>
      <h3>{t('edit')}</h3>
      <div className="fld"><label>{t('rev_date')}</label><input type="date" value={f.date} onChange={set('date')} /></div>
      <div className="fld"><label>{t('rev_party')}</label>
        <input list="partyList" value={f.party} onChange={set('party')} />
        <datalist id="partyList">{S.parties.map((p) => <option key={p.n} value={p.n} />)}</datalist></div>
      <div className="fld"><label>{t('rev_amount')}</label><input type="number" value={f.amount} onChange={set('amount')} /></div>
      <div className="fld"><label>{t('in')} / {t('out')}</label>
        <select value={f.dir} onChange={set('dir')}><option value="">—</option><option value="in">{t('in')}</option><option value="out">{t('out')}</option></select></div>
      <div className="fld"><label>{t('rev_narr')}</label>
        <select value={f.nature} onChange={set('nature')}>{S.accounts.filter((a) => a !== 'Cash').concat('Other').map((a) => <option key={a}>{a}</option>)}</select></div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn soft" onClick={onClose}>{t('cancel')}</button>
        <button className="btn" onClick={save}>{t('save')}</button>
      </div>
    </Modal>
  );
}

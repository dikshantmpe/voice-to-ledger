'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import { dateLabel, fmt } from '@/lib/format';

const signed = (n) => (n >= 0 ? '+ ' : '− ') + fmt(Math.abs(n));

export default function PartiesView() {
  const { S, t, addParty, toast } = useApp();
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState(null);
  const [f, setF] = useState({ name: '', type: 'Customer', open: '' });

  // saved parties + any party name that appeared in approved entries (auto-created from voice)
  const rows = useMemo(() => {
    const map = new Map(S.parties.map((p) => [p.n.toLowerCase(), { n: p.n, t: p.t, open: p.open || 0 }]));
    const approved = S.entries.filter((e) => e.status === 'approved' && e.party);
    approved.forEach((e) => {
      const k = e.party.toLowerCase();
      if (!map.has(k)) map.set(k, { n: e.party, t: e.dir === 'in' ? 'Customer' : 'Supplier', open: 0 });
    });
    return [...map.values()]
      .map((p) => {
        const tx = approved.filter((e) => e.party.toLowerCase() === p.n.toLowerCase());
        const inA = tx.filter((e) => e.dir === 'in').reduce((a, e) => a + (e.amount || 0), 0);
        const outA = tx.filter((e) => e.dir === 'out').reduce((a, e) => a + (e.amount || 0), 0);
        return { ...p, tx, bal: p.open + inA - outA };
      })
      .sort((a, b) => Math.abs(b.bal) - Math.abs(a.bal));
  }, [S]);

  const typeLabel = (x) => (x === 'Supplier' ? t('par_supplier') : t('par_customer'));

  const save = () => {
    if (!addParty(f.name, f.type, f.open)) { toast(t('par_exists')); return; }
    setF({ name: '', type: 'Customer', open: '' });
    setAdding(false);
  };

  return (
    <section>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '.8rem' }}>
        <div><h1>{t('par_title')}</h1><p className="sub" style={{ marginBottom: 0 }}>{t('par_sub')}</p></div>
        <button className="btn" onClick={() => setAdding(true)}>{t('par_add')}</button>
      </div>

      <div className="card">
        {rows.length === 0 && <div className="empty">{t('par_none')}</div>}
        {rows.map((p) => (
          <div className="pt-row" key={p.n}>
            <div>
              <b>{p.n}</b> <span className="pt-type">{typeLabel(p.t)}</span>
              <div className="kv">{t('par_opening_l')} {fmt(p.open)} · {p.tx.length} {t('par_txn')}</div>
            </div>
            <div className="pt-right">
              <b className={p.bal >= 0 ? 'in' : 'out'}>{signed(p.bal)}</b>
              <button className="btn sm soft" onClick={() => setDetail(p)}>{t('par_detail')}</button>
            </div>
          </div>
        ))}
      </div>

      {/* add party */}
      <Modal open={adding} onClose={() => setAdding(false)}>
        <h3>{t('par_add').replace('+ ', '')}</h3>
        <div className="fld"><label>{t('par_name')}</label>
          <input value={f.name} autoFocus onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="fld"><label>{t('par_type')}</label>
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="Customer">{t('par_customer')}</option><option value="Supplier">{t('par_supplier')}</option>
          </select></div>
        <div className="fld"><label>{t('par_opening')}</label>
          <input type="number" value={f.open} onChange={(e) => setF({ ...f, open: e.target.value })} /></div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn soft" onClick={() => setAdding(false)}>{t('cancel')}</button>
          <button className="btn" onClick={save}>{t('save')}</button>
        </div>
      </Modal>

      {/* party detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{detail.n} <span className="pt-type">{typeLabel(detail.t)}</span></h3>
              <button className="btn sm soft" onClick={() => setDetail(null)}>{t('as_close')}</button>
            </div>
            <div className="pt-total">{t('par_balance')}: <b className={detail.bal >= 0 ? 'in' : 'out'}>{signed(detail.bal)}</b></div>
            {detail.tx.length === 0 && <div className="empty">{t('led_none')}</div>}
            {detail.tx.map((e) => (
              <div className="pt-row" key={e.id}>
                <div><b>{e.nature}</b><div className="kv">{dateLabel(e.date)} · {e.phrase}</div></div>
                <b className={e.dir === 'in' ? 'in' : 'out'}>{e.dir === 'in' ? '+ ' : '− '}{fmt(e.amount)}</b>
              </div>
            ))}
          </>
        )}
      </Modal>
    </section>
  );
}

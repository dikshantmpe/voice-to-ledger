'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import { dateLabel, fmt } from '@/lib/format';
import { partyRows, toCSV, downloadCSV } from '@/lib/reports';
import { getPhone, setPhone } from '@/lib/partyPhones';
import { buildReminderLink, buildShareLink } from '@/lib/whatsapp';

const signed = (n) => (n >= 0 ? '+ ' : '− ') + fmt(Math.abs(n));
const FILTERS = [['all', 'All'], ['customer', 'Customers'], ['supplier', 'Suppliers'], ['due', 'Due']];

export default function PartiesView() {
  const { S, t, addParty, toast } = useApp();
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('all');
  const [f, setF] = useState({ name: '', type: 'Customer', open: '', phone: '' });
  const [tick, setTick] = useState(0); // re-render after phone edits

  const rows = useMemo(() => partyRows(S.entries, S.parties), [S]);

  const visible = rows.filter((p) => {
    if (filter === 'customer') return p.t !== 'Supplier';
    if (filter === 'supplier') return p.t === 'Supplier';
    if (filter === 'due') return p.t !== 'Supplier' && p.bal > 0;
    return true;
  });

  const typeLabel = (x) => (x === 'Supplier' ? t('par_supplier') : t('par_customer'));

  const save = () => {
    if (!f.name.trim()) { toast(t('par_name')); return; }
    if (!addParty(f.name.trim(), f.type, f.open)) { toast(t('par_exists')); return; }
    if (f.phone) setPhone(f.name.trim(), f.phone);
    setF({ name: '', type: 'Customer', open: '', phone: '' });
    setAdding(false);
  };

  const exportCSV = () => {
    const csv = toCSV(
      ['Party', 'Type', 'Opening', 'Transactions', 'Balance', 'Phone'],
      visible.map((p) => [p.n, p.t, p.open, p.tx.length, p.bal, getPhone(p.n)])
    );
    downloadCSV('voxledger-parties.csv', csv);
  };

  const shareSummary = () => {
    const text = ['VoxLedger parties', ...visible.map((p) => `${p.n} (${p.t}): ${signed(p.bal)}`)].join('\n');
    window.open(buildShareLink(text), '_blank', 'noopener');
  };

  const savePhoneFor = (name, value) => {
    setPhone(name, value);
    setTick((x) => x + 1);
    toast('Saved');
  };

  return (
    <section>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '.8rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <div><h1>{t('par_title')}</h1><p className="sub" style={{ marginBottom: 0 }}>{t('par_sub')}</p></div>
        <div className="row" style={{ gap: '.4rem', flexWrap: 'wrap' }}>
          <button className="btn sm soft" onClick={exportCSV}>⤓ Export</button>
          <button className="btn sm soft" onClick={shareSummary}>⇪ Share</button>
          <button className="btn" onClick={() => setAdding(true)}>{t('par_add')}</button>
        </div>
      </div>

      <div className="row" style={{ gap: '.4rem', flexWrap: 'wrap', marginBottom: '.8rem' }}>
        {FILTERS.map(([k, label]) => (
          <button key={k} className={`btn sm ${filter === k ? '' : 'soft'}`} onClick={() => setFilter(k)}>
            ⏷ {label}
          </button>
        ))}
      </div>

      <div className="card">
        {visible.length === 0 && <div className="empty">{t('par_none')}</div>}
        {visible.map((p) => (
          <div className="pt-row" key={p.n}>
            <div>
              <b>{p.n}</b> <span className="pt-type">{typeLabel(p.t)}</span>
              <div className="kv">{t('par_opening_l')} {fmt(p.open)} · {p.tx.length} {t('par_txn')}</div>
            </div>
            <div className="pt-right">
              <b className={p.bal >= 0 ? 'in' : 'out'}>{signed(p.bal)}</b>
              <div className="row" style={{ gap: '.3rem' }}>
                {p.t !== 'Supplier' && p.bal > 0 && (
                  <a className="btn sm" style={{ background: '#25D366', color: '#fff' }} target="_blank" rel="noopener noreferrer"
                    href={buildReminderLink({ phone: getPhone(p.n), name: p.n, amount: p.bal })}>
                    💬 Remind
                  </a>
                )}
                <button className="btn sm soft" onClick={() => setDetail(p)}>{t('par_detail')}</button>
              </div>
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
        <div className="fld"><label>Phone (for WhatsApp reminder)</label>
          <input type="tel" inputMode="numeric" placeholder="10-digit mobile" value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
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

            <div className="fld" style={{ marginTop: '.8rem' }}>
              <label>Phone (for WhatsApp reminder)</label>
              <div className="row" style={{ gap: '.4rem' }}>
                <input key={tick} type="tel" inputMode="numeric" defaultValue={getPhone(detail.n)} id="party-phone" />
                <button className="btn sm soft" onClick={() => savePhoneFor(detail.n, document.getElementById('party-phone').value)}>
                  {t('save')}
                </button>
              </div>
            </div>

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
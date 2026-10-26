'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import ReviewCard from './ReviewCard';
import EditModal from './EditModal';

const TABS = [['pending', '⏳', 'rev_pending'], ['approved', '✔', 'rev_approved'], ['rejected', '✕', 'rev_rejected']];

export default function ReviewView({ goRecord }) {
  const { S, t, bulkApproveClean, toast } = useApp();
  const [tab, setTab] = useState('pending');
  const [editing, setEditing] = useState(null);
  const rows = S.entries.filter((e) => e.status === tab);

  return (
    <section>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '.8rem' }}>
        <div><h1>{t('rev_title')}</h1><p className="sub" style={{ marginBottom: 0 }}>{t('rev_sub')}</p></div>
        <button className="btn gold sm" onClick={() => toast(`✔ ${bulkApproveClean()}`)}>✔ Bulk approve clean</button>
      </div>

      <div className="rtabs">
        {TABS.map(([k, ico, key]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {ico} {t(key)}<b>{S.entries.filter((e) => e.status === k).length}</b>
          </button>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="card empty">
          {tab === 'pending' ? <>✦ {t('rev_empty')}<br /><br /><button className="btn" onClick={goRecord}>{t('rec_title')}</button></> : t('rev_none')}
        </div>
      )}
      {rows.map((e) => <ReviewCard key={e.id} e={e} tab={tab} onEdit={setEditing} />)}
      <EditModal entry={editing} onClose={() => setEditing(null)} />
    </section>
  );
}

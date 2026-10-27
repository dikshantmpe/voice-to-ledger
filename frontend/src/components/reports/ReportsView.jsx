'use client';
import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { partyRows, pendingCollections, trialBalance, reportText, toCSV, downloadCSV } from '@/lib/reports';
import { buildReminderLink, buildShareLink } from '@/lib/whatsapp';
import { getPhone } from '@/lib/partyPhones';

const PALETTE = ['#1e6fd9', '#e0a100', '#1e9e5a', '#d94b4b', '#8b5cf6', '#14b8a6', '#f97316', '#64748b'];

export default function ReportsView() {
  const { S } = useApp();

  const tb = useMemo(() => trialBalance(S.entries), [S.entries]);
  const pending = useMemo(() => pendingCollections(partyRows(S.entries, S.parties)), [S]);
  const maxActivity = Math.max(1, ...tb.rows.map((r) => r.debit + r.credit));
  const totalDebit = tb.rows.reduce((s, r) => s + r.debit, 0) || 1;

  // donut: each account's share of total debits
  let acc = 0;
  const slices = tb.rows.map((r, i) => {
    const pct = (r.debit / totalDebit) * 100;
    const slice = { ...r, pct, offset: acc, color: PALETTE[i % PALETTE.length] };
    acc += pct;
    return slice;
  });

  const exportCSV = () => {
    const csv = toCSV(
      ['Account', 'Debit', 'Credit'],
      [...tb.rows.map((r) => [r.account, r.debit, r.credit]), ['Total', tb.debit, tb.credit]]
    );
    downloadCSV('voxledger-trial-balance.csv', csv);
  };

  const shareReport = () => {
    window.open(buildShareLink(reportText(tb, pending)), '_blank', 'noopener');
  };

  return (
    <section>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '.8rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <div><h1>Reports</h1><p className="sub" style={{ marginBottom: 0 }}>Trial balance from approved entries.</p></div>
        <div className="row" style={{ gap: '.4rem' }}>
          <button className="btn sm soft" onClick={exportCSV}>⤓ Export</button>
          <button className="btn sm" onClick={shareReport}>⇪ Share report</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ padding: '.6rem .8rem', borderRadius: 8, marginBottom: '.8rem',
          background: tb.balanced ? '#e8f7ee' : '#fdecec', color: tb.balanced ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
          {tb.balanced ? '✓ Debits equal credits' : '✕ Debits and credits do not match'}
        </div>

        {tb.rows.length === 0 ? (
          <div className="empty">No approved entries yet.</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.92rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '.4rem' }}>Account</th>
                  <th style={{ padding: '.4rem', textAlign: 'right' }}>Debit</th>
                  <th style={{ padding: '.4rem', textAlign: 'right' }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {tb.rows.map((r) => (
                  <tr key={r.account} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '.4rem' }}>{r.account}</td>
                    <td style={{ padding: '.4rem', textAlign: 'right' }}>{r.debit ? fmt(r.debit) : '–'}</td>
                    <td style={{ padding: '.4rem', textAlign: 'right' }}>{r.credit ? fmt(r.credit) : '–'}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700 }}>
                  <td style={{ padding: '.4rem' }}>Total</td>
                  <td style={{ padding: '.4rem', textAlign: 'right' }}>{fmt(tb.debit)}</td>
                  <td style={{ padding: '.4rem', textAlign: 'right' }}>{fmt(tb.credit)}</td>
                </tr>
              </tbody>
            </table>

            {/* account activity bars */}
            <h3 style={{ marginTop: '1.2rem', fontSize: '1rem' }}>Activity by account</h3>
            {tb.rows.map((r) => (
              <div key={r.account} style={{ margin: '.4rem 0' }}>
                <div style={{ fontSize: '.85rem' }}>{r.account}</div>
                <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: '#f1f5f9' }}>
                  <div title={`Debit ${fmt(r.debit)}`} style={{ width: `${(r.debit / maxActivity) * 100}%`, background: '#1e9e5a' }} />
                  <div title={`Credit ${fmt(r.credit)}`} style={{ width: `${(r.credit / maxActivity) * 100}%`, background: '#d94b4b' }} />
                </div>
              </div>
            ))}
            <div style={{ fontSize: '.8rem', color: '#64748b', marginTop: '.3rem' }}>
              <span style={{ color: '#1e9e5a' }}>■</span> Debit &nbsp; <span style={{ color: '#d94b4b' }}>■</span> Credit
            </div>

            {/* debit share donut */}
            <h3 style={{ marginTop: '1.2rem', fontSize: '1rem' }}>Share of debits</h3>
            <div className="row" style={{ gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <svg width="160" height="160" viewBox="0 0 42 42" aria-label="Debit share by account">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                {slices.map((s) => (
                  <circle key={s.account} cx="21" cy="21" r="15.915" fill="transparent"
                    stroke={s.color} strokeWidth="6"
                    strokeDasharray={`${s.pct} ${100 - s.pct}`}
                    strokeDashoffset={-s.offset + 25}
                    transform="rotate(-90 21 21)" />
                ))}
              </svg>
              <div style={{ fontSize: '.85rem' }}>
                {slices.map((s) => (
                  <div key={s.account}><span style={{ color: s.color }}>■</span> {s.account} · {s.pct.toFixed(1)}%</div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* pending collections */}
      <div className="card">
        <h3 style={{ margin: 0 }}>Pending collections</h3>
        <div className="sub">{pending.length} · {fmt(pending.reduce((s, p) => s + p.bal, 0))}</div>
        {pending.length === 0 && <div className="empty">Nothing pending. 🎉</div>}
        {pending.map((p) => (
          <div className="pt-row" key={p.n}>
            <div>
              <b>{p.n}</b>
              <div className="kv">{getPhone(p.n) ? `+91 ${getPhone(p.n)}` : 'No phone saved – add it in Parties'}</div>
              <b className="in">{fmt(p.bal)}</b>
            </div>
            <a className="btn sm" style={{ background: '#25D366', color: '#fff' }} target="_blank" rel="noopener noreferrer"
              href={buildReminderLink({ phone: getPhone(p.n), name: p.n, amount: p.bal })}>
              💬 Remind
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
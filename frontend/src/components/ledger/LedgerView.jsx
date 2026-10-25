'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dateLabel, fmt } from '@/lib/format';
import ShareReport from '@/components/share/ShareReport';
import { buildLedgerText, buildLedgerCsv } from '@/lib/report';

export default function LedgerView() {
  const { S, t } = useApp();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [party, setParty] = useState('');
  const [q, setQ] = useState('');
  const [sharing, setSharing] = useState(false);

  const approved = S.entries.filter((e) => e.status === 'approved');
  const parties = [...new Set(approved.map((e) => e.party).filter(Boolean))];
  const rows = approved.filter((e) => (!from || e.date >= from) && (!to || e.date <= to) && (!party || e.party === party) && (!q || e.phrase.toLowerCase().includes(q.toLowerCase())));

  // debits-equal-credits check is over ALL approved lines (the full books), not just the filter
  const { dr, cr } = useMemo(() => {
    let dr = 0, cr = 0;
    approved.forEach((e) => e.lines.forEach((l) => { dr += l.d || 0; cr += l.c || 0; }));
    return { dr, cr };
  }, [approved]);
  const balanced = dr === cr;

  const shownDr = rows.reduce((a, e) => a + (e.lines.find((l) => l.d > 0)?.d || 0), 0);
  const shownCr = rows.reduce((a, e) => a + (e.lines.find((l) => l.c > 0)?.c || 0), 0);
  const cash = S.biz.cash + approved.reduce((a, e) => a + (e.dir === 'in' ? e.amount || 0 : -(e.amount || 0)), 0);

  return (
    <section>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '.8rem' }}>
        <div><h1>{t('led_title')}</h1><p className="sub" style={{ marginBottom: 0 }}>{t('led_sub')}</p></div>
        <button className="btn gold sm" onClick={() => setSharing(true)} disabled={!rows.length}>{t('share_report')}</button>
      </div>
      <div className="card">
        <div className="row" style={{ marginBottom: '.8rem' }}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <select value={party} onChange={(e) => setParty(e.target.value)}>
            <option value="">{t('led_all')}</option>
            {parties.map((p) => <option key={p}>{p}</option>)}
          </select>
          <input className="grow" value={q} placeholder={t('led_search')} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 140 }} />
        </div>

        <div className={'chk' + (balanced ? '' : ' bad')}>
          {balanced ? t('led_balanced') : `${t('led_diff')} ${fmt(Math.abs(dr - cr))}`}
          &nbsp;·&nbsp; {t('led_totdr')} {fmt(dr)} &nbsp;·&nbsp; {t('led_totcr')} {fmt(cr)}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>{t('led_date')}</th><th>{t('led_narr')}</th><th>{t('led_dr')}</th><th>{t('led_cr')}</th><th className="num">{t('led_amt')}</th></tr></thead>
            <tbody>
              {rows.map((e) => {
                const d = e.lines.find((l) => l.d > 0);
                const c = e.lines.find((l) => l.c > 0);
                return (
                  <tr key={e.id}>
                    <td>{dateLabel(e.date)}</td>
                    <td>{e.phrase}{e.party && <div className="kv">{e.party}</div>}</td>
                    <td className="in">{d?.a}</td>
                    <td className="out">{c?.a}</td>
                    <td className="num"><b>{fmt(e.amount)}</b></td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan="5" className="empty">{t('led_none')}</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="totbar">
          <span>Dr: <b>{fmt(shownDr)}</b></span>
          <span>Cr: <b>{fmt(shownCr)}</b></span>
          <span style={{ marginLeft: 'auto' }}>{t('sum_cash')}: <span className="balancebadge">{fmt(cash)}</span></span>
        </div>
      </div>
      <ShareReport open={sharing} onClose={() => setSharing(false)} title={t('share_ledger')}
        text={buildLedgerText({ biz: S.biz.name, rows, dr, cr, cash, t })} csv={buildLedgerCsv(rows)} filename="voxledger-ledger.csv" />
    </section>
  );
}

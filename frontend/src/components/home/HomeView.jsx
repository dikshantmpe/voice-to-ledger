'use client';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dateLabel, fmt } from '@/lib/format';

// numbers count up when the page opens
function CountUp({ value }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = (ts) => {
      if (start === undefined) start = ts;
      const p = Math.min(1, (ts - start) / 800);
      setV(Math.round(value * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{fmt(v)}</>;
}

const LOCALE = { hi: 'hi-IN', pa: 'pa-IN' };

export default function HomeView({ goRecord, goReview, goLedger }) {
  const { S, t, lang, summary: s, pending } = useApp();

  // last 7 days of approved money in / out
  const days = useMemo(() => {
    const out = [];
    for (let n = 6; n >= 0; n--) {
      const iso = new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
      const rows = S.entries.filter((e) => e.status === 'approved' && e.date === iso);
      out.push({
        iso,
        label: new Date(iso).toLocaleDateString(LOCALE[lang] || 'en-IN', { weekday: 'short' }),
        inA: rows.filter((e) => e.dir === 'in').reduce((a, e) => a + (e.amount || 0), 0),
        outA: rows.filter((e) => e.dir === 'out').reduce((a, e) => a + (e.amount || 0), 0),
      });
    }
    return out;
  }, [S.entries, lang]);

  const max = Math.max(1, ...days.flatMap((d) => [d.inA, d.outA]));
  const recent = S.entries.filter((e) => e.status !== 'rejected').slice(0, 4);

  const cards = [
    [t('sum_in'), s.inAmt, 'in'],
    [t('sum_out'), s.outAmt, 'out'],
    [t('sum_net'), s.net, s.net >= 0 ? 'in' : 'out'],
    [t('sum_cash'), s.cash, 'cash'],
  ];

  return (
    <section className="home">
      {/* hero with the big mic */}
      <div className="hm-hero">
        <div>
          <small>{t('home_title')}</small>
          <h1>{S.biz.name}</h1>
          <p>{t('home_speak')}</p>
        </div>
        <button className="hm-mic" onClick={goRecord} aria-label={t('home_speak')}>
          <span className="hm-ring" /><span className="hm-ring r2" />
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" /></svg>
        </button>
      </div>

      {pending.length > 0 && (
        <div className="hm-alert">
          <span><b>{pending.length}</b> {t('home_wait')}</span>
          <button className="btn sm" onClick={goReview}>{t('home_review_now')} →</button>
        </div>
      )}

      <div className="hm-stats">
        {cards.map(([label, val, tone]) => (
          <div className={'hm-stat ' + tone} key={label}>
            <div className="hm-v"><CountUp value={val} /></div>
            <div className="hm-l">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <b>{t('home_week')}</b>
          <span className="hm-legend"><i className="in" />{t('sum_in')} <i className="out" />{t('sum_out')}</span>
        </div>
        <div className="hm-chart">
          {days.map((d) => (
            <div className="hm-col" key={d.iso} title={`${d.iso}  +${fmt(d.inA)}  −${fmt(d.outA)}`}>
              <div className="hm-bars">
                <i className="in" style={{ height: (d.inA / max) * 100 + '%' }} />
                <i className="out" style={{ height: (d.outA / max) * 100 + '%' }} />
              </div>
              <span>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '.5rem' }}>
          <b>{t('home_recent')}</b>
          <button className="btn sm soft" onClick={goLedger}>{t('nav_ledger')} →</button>
        </div>
        {recent.length === 0 && <div className="empty">{t('home_none')}</div>}
        {recent.map((e) => (
          <div className="hm-row" key={e.id}>
            <div>
              <b>{e.party || e.nature}</b>
              <div className="kv">{dateLabel(e.date)} · {e.nature}{e.status === 'pending' ? ' · ' + t('rev_pending') : ''}</div>
            </div>
            <b className={e.dir === 'in' ? 'in' : e.dir === 'out' ? 'out' : ''}>
              {e.amount ? (e.dir === 'in' ? '+ ' : e.dir === 'out' ? '− ' : '') + fmt(e.amount) : '—'}
            </b>
          </div>
        ))}
      </div>
    </section>
  );
}

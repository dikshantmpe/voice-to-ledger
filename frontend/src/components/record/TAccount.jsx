'use client';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';

// Animated debit / credit pair: money flows from the credit account to the debit account.
export default function TAccount({ lines }) {
  const { t } = useApp();
  const dr = lines.find((l) => l.d > 0);
  const cr = lines.find((l) => l.c > 0);
  if (!dr || !cr) return null;
  return (
    <div className="ta">
      <div className="ta-row">
        <div className="ta-side dr"><small>{t('led_dr')}</small><b>{dr.a}</b><span>{fmt(dr.d)}</span></div>
        <div className="ta-flow" aria-hidden="true"><i /><i /><i /></div>
        <div className="ta-side cr"><small>{t('led_cr')}</small><b>{cr.a}</b><span>{fmt(cr.c)}</span></div>
      </div>
      <div className="ta-ok">{t('ta_ok')}</div>
    </div>
  );
}

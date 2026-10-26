'use client';
import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { parseEntry } from '@/lib/parser';
import { dateLabel, fmt } from '@/lib/format';

// Shows what the app understands from the words so far. Chips pop in as they are recognised.
export default function LiveUnderstanding({ text }) {
  const { S, t } = useApp();
  const p = useMemo(() => (text && text.trim() ? parseEntry(text, S.parties) : null), [text, S.parties]);
  if (!p) return null;

  const chips = [];
  if (p.amount) chips.push(['amt', fmt(p.amount)]);
  if (p.dir) chips.push([p.dir, p.dir === 'in' ? t('in') : t('out')]);
  if (p.nature !== 'Other') chips.push(['nat', p.nature]);
  if (p.party) chips.push(['pty', p.party]);
  chips.push(['dat', dateLabel(p.date)]);

  return (
    <div className="lu">
      <div className="lu-title"><span className="lu-dot" />{t('lu_title')}</div>
      <div className="lu-text">“{text}”</div>
      <div className="lu-chips">
        {chips.map(([k, v]) => <span key={k + v} className={'lu-chip ' + k}>{v}</span>)}
      </div>
    </div>
  );
}

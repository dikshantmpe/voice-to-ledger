'use client';
import { useApp } from '@/context/AppContext';

export const VIEWS = [
  ['home', '⌂', 'nav_home'],
  ['record', '◉', 'nav_record'],
  ['review', '▤', 'nav_review'],
  ['ledger', '≣', 'nav_ledger'],
];

export default function NavButtons({ view, setView }) {
  const { t, pending } = useApp();
  return (
    <nav className="mainnav" id="mainnav">
      {VIEWS.map(([id, ico, key]) => (
        <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
          {ico} {t(key)} {id === 'review' && <span className="badge">{pending.length}</span>}
        </button>
      ))}
    </nav>
  );
}

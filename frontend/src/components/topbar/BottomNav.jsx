'use client';
import { useApp } from '@/context/AppContext';
import { VIEWS } from './NavButtons';

export default function BottomNav({ view, setView }) {
  const { t, pending } = useApp();
  return (
    <nav className="bottomnav" id="bottomnav">
      {VIEWS.map(([id, ico, key]) => (
        <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
          <span className="bico">{ico}</span>
          <span>{t(key)}</span>
          {id === 'review' && <span className="badge">{pending.length}</span>}
        </button>
      ))}
    </nav>
  );
}

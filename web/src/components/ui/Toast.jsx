'use client';
import { useApp } from '@/context/AppContext';

export default function Toast() {
  const { toastMsg } = useApp();
  return (
    <div id="toast" style={{
      position: 'fixed', left: '50%', bottom: 90, transform: 'translateX(-50%)', zIndex: 600,
      background: '#0B1B4B', color: '#fff', padding: '.6rem 1.1rem', borderRadius: 999,
      fontWeight: 700, fontSize: '.9rem', opacity: toastMsg ? 1 : 0, pointerEvents: 'none', transition: 'opacity .25s',
    }}>{toastMsg}</div>
  );
}

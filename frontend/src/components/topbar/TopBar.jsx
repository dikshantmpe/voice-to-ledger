'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import NavButtons from './NavButtons';
import LangSwitch from './LangSwitch';
import DropMenu from './DropMenu';
import { clearSession } from '@/lib/auth';

export default function TopBar({ view, setView, onSummary, onAssistant }) {
  const router = useRouter();
  const { S, t } = useApp();
  const [dark, setDark] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);

  const logout = () => {
    clearSession();
    router.replace('/login/');
  };

  return (
    <header className="topbar">
      <button className="brand" onClick={() => router.push('/')}>
        <span className="logo" /><span>VoxLedger</span>
      </button>

      <NavButtons view={view} setView={setView} />
      <div style={{ flex: 1 }} />

      {/* voice assistant (reads entries aloud, answer with ✔ / ✘) */}
      <button className="iconbtn tb-ico" title={t('as_title')} aria-label={t('as_title')} onClick={onAssistant}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" /></svg>
      </button>

      {/* daily summary */}
      <button className="iconbtn tb-ico" title={t('sum_title')} aria-label={t('sum_title')} onClick={onSummary}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9h3v10H5V9zm5.5-5h3v15h-3V4zM16 13h3v6h-3v-6z" /></svg>
      </button>

      {/* visible logout button */}
      <button className="iconbtn tb-ico" title={t('logout')} aria-label={t('logout')} onClick={logout}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>
      </button>

      <LangSwitch />

      <DropMenu className="avatar" trigger={<button className="btn" style={{ background: 'var(--gold)', color: '#0B1B4B' }}>{S.biz.name[0]}</button>}>
        <div className="dd-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
          <b>{S.biz.name}</b>
        </div>
        <hr />
        <button onClick={(e) => { e.stopPropagation(); setDark((d) => !d); }}>
          ◐ {t('dark')} <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '.8rem' }}>{dark ? 'On' : 'Off'}</span>
        </button>
        <button onClick={logout}>⎋ {t('logout')}</button>
      </DropMenu>
    </header>
  );
}
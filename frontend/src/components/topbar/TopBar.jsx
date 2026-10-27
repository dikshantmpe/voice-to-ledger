'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { LANGS } from '@/lib/i18n';
import { clearSession } from '@/lib/auth';

// ---- shared nav config (was NavButtons.jsx) ----
export const VIEWS = [
  ['home', '⌂', 'nav_home'],
  ['record', '◉', 'nav_record'],
  ['review', '▤', 'nav_review'],
  ['ledger', '≣', 'nav_ledger'],
  ['parties', '◈', 'nav_parties'],
  ['reports', '▦', 'nav_reports'],
];

// ---- top nav row (was NavButtons.jsx) ----
export function NavButtons({ view, setView }) {
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

// ---- bottom nav row (was BottomNav.jsx) ----
export function BottomNav({ view, setView }) {
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

// ---- language switcher (was LangSwitch.jsx) ----
export function LangSwitch() {
  const { lang, setLang } = useApp();
  return (
    <div className="langswitch" id="langswitch">
      {LANGS.map((l) => (
        <button key={l.code} className={lang === l.code ? 'on' : ''} onClick={() => setLang(l.code)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

// ---- small dropdown: trigger + menu that closes on outside click (was DropMenu.jsx) ----
export function DropMenu({ trigger, className = '', children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  return (
    <div className={'menuwrap ' + className} ref={ref}>
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      <div className={'dropdown' + (open ? ' open' : '')} onClick={() => setOpen(false)}>{children}</div>
    </div>
  );
}

// ---- the top bar itself ----
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
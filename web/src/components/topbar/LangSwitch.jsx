'use client';
import { LANGS } from '@/lib/i18n';
import { useApp } from '@/context/AppContext';

export default function LangSwitch() {
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

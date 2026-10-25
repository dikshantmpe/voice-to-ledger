'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import LangSwitch from '@/components/topbar/LangSwitch';
import OtpInput from './OtpInput';
import { sendOtp, verifyOtp, saveSession, getSession, isDemo } from '@/lib/auth';

const RESEND_SECS = 30;

// Text on the left (blue) panel, per language
const HERO = {
  en: { h1: 'Speak your books.', h2: 'We write the ledger.', sub: 'Voice-first bookkeeping for small businesses in Hindi, Punjabi, English and Hinglish.', p: ['Speak or type any entry', 'Review before it is posted', 'Balanced double entry, always'] },
  hi: { h1: 'बोलिए अपना हिसाब।', h2: 'बही हम लिखेंगे।', sub: 'छोटे व्यापार के लिए आवाज़ से हिसाब, हिन्दी, ਪੰਜਾਬੀ, English और Hinglish में।', p: ['बोलकर या लिखकर एंट्री करें', 'पोस्ट होने से पहले जाँचें', 'हमेशा संतुलित दोहरी एंट्री'] },
  pa: { h1: 'ਬੋਲੋ ਆਪਣਾ ਹਿਸਾਬ।', h2: 'ਬਹੀ ਅਸੀਂ ਲਿਖਾਂਗੇ।', sub: 'ਛੋਟੇ ਕਾਰੋਬਾਰ ਲਈ ਆਵਾਜ਼ ਨਾਲ ਹਿਸਾਬ, ਹਿੰਦੀ, ਪੰਜਾਬੀ, English ਅਤੇ Hinglish ਵਿੱਚ।', p: ['ਬੋਲ ਕੇ ਜਾਂ ਲਿਖ ਕੇ ਐਂਟਰੀ ਕਰੋ', 'ਪੋਸਟ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਜਾਂਚੋ', 'ਹਮੇਸ਼ਾ ਸੰਤੁਲਿਤ ਦੋਹਰੀ ਐਂਟਰੀ'] },
  hing: { h1: 'Bolo apna hisaab.', h2: 'Bahi hum likhenge.', sub: 'Chhote business ke liye voice bookkeeping, Hindi, Punjabi, English aur Hinglish mein.', p: ['Bolkar ya likhkar entry karein', 'Post hone se pehle check karein', 'Hamesha balanced double entry'] },
};

const PhoneIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm-5 21a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zM17 18H7V4h10v14z" /></svg>
);
const ShieldIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.2 15.2l-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6z" /></svg>
);

export default function LoginForm() {
  const { t, lang } = useApp();
  const router = useRouter();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [secs, setSecs] = useState(0);
  const H = HERO[lang] || HERO.en;

  // already logged in -> straight to the app
  useEffect(() => { if (getSession()) router.replace('/app/'); }, [router]);

  // resend countdown
  useEffect(() => {
    if (secs <= 0) return;
    const id = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secs]);

  const send = async () => {
    setErr('');
    if (!/^[6-9]\d{9}$/.test(phone)) { setErr(t('login_bad_phone')); return; }
    setBusy(true);
    try {
      await sendOtp(phone);
      setStep('otp'); setOtp(''); setSecs(RESEND_SECS);
    } catch (e) { setErr(t('login_fail_send')); }
    setBusy(false);
  };

  const verify = async () => {
    setErr('');
    if (otp.length !== 6) { setErr(t('login_bad_otp')); return; }
    setBusy(true);
    try {
      const { token } = await verifyOtp(phone, otp);
      saveSession({ phone, token, at: Date.now() });
      router.replace('/app/');
    } catch (e) { setErr(t('login_bad_otp')); setOtp(''); }
    setBusy(false);
  };

  return (
    <main className="lp">
      {/* ---------- left: brand panel ---------- */}
      <aside className="lp-hero">
        <svg className="lp-rings" viewBox="0 0 520 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {[80, 140, 200, 260, 320].map((r) => <circle key={r} cx="400" cy="120" r={r} />)}
        </svg>

        <div className="lp-toprow">
          <span className="lp-brand"><span className="logo" /><span>VoxLedger</span></span>
          <LangSwitch />
        </div>

        <div className="lp-copy">
          <h2>{H.h1}<br /><span>{H.h2}</span></h2>
          <p className="lp-sub">{H.sub}</p>
          <ul className="lp-points">
            {H.p.map((x) => <li key={x}><i>✔</i>{x}</li>)}
          </ul>
        </div>

        <div className="lp-demo-art" aria-hidden="true">
          <div className="lp-wave">
            {Array.from({ length: 26 }, (_, i) => <span key={i} style={{ animationDelay: (i * 0.07) + 's' }} />)}
          </div>
          <div className="lp-bubble">“kal 2 hazar kiraya diya” <b>− ₹2,000 · Rent</b></div>
        </div>
      </aside>

      {/* ---------- right: form ---------- */}
      <section className="lp-formside">
        <div className="lp-card">
          <div className="lp-steps" aria-hidden="true">
            <span className="on" />
            <span className={step === 'otp' ? 'on' : ''} />
          </div>

          <div className="lp-icon">{step === 'phone' ? <PhoneIcon /> : <ShieldIcon />}</div>

          {step === 'phone' ? (
            <>
              <h1>{t('login_title')}</h1>
              <p className="lp-lead">{t('login_sub')}</p>

              <label className="lp-label" htmlFor="phone">{t('login_phone')}</label>
              <div className="lp-phone">
                <span className="lp-cc">🇮🇳 +91</span>
                <input id="phone" type="tel" inputMode="numeric" maxLength={10} value={phone} placeholder="98765 43210" autoFocus
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && send()} />
              </div>

              {err && <div className="loginerr" role="alert">{err}</div>}
              <button className="lp-btn" onClick={send} disabled={busy}>{busy ? '…' : t('login_send') + ' →'}</button>
            </>
          ) : (
            <>
              <h1>{t('login_otp_title')}</h1>
              <p className="lp-lead">{t('login_otp_sub')} <b>+91 {phone}</b></p>

              <OtpInput value={otp} onChange={setOtp} />
              {isDemo() && <div className="lp-demo">{t('login_demo')}</div>}

              {err && <div className="loginerr" role="alert">{err}</div>}
              <button className="lp-btn" onClick={verify} disabled={busy || otp.length !== 6}>{busy ? '…' : t('login_verify') + ' →'}</button>

              <div className="lp-links">
                <button onClick={() => { setStep('phone'); setErr(''); }}>← {t('login_change')}</button>
                <button onClick={send} disabled={secs > 0 || busy}>
                  {secs > 0 ? `${t('login_resend_in')} ${secs}s` : t('login_resend')}
                </button>
              </div>
            </>
          )}
        </div>
        <p className="lp-foot">🔒 VoxLedger · Your data stays safe</p>
      </section>
    </main>
  );
}
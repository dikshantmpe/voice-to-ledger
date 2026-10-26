'use client';
import { useRouter } from 'next/navigation';

const ELLIPSES = [[230, 110], [200, 96], [170, 82], [140, 66], [110, 50]];
const BARS = [14, 26, 40, 22, 46, 30, 18, 34, 20, 12];

export default function Hero({ goTo }) {
  const router = useRouter();
  return (
    <section className="hero">
      <div className="lwrap hgrid">
        <div>
          <span className="eyebrow">Voice bookkeeping</span>
          <h1>What is <span>VoxLedger?</span></h1>
          <p className="lead">VoxLedger is a voice-first bookkeeping app for small businesses. Speak in English, हिन्दी or ਪੰਜਾਬੀ, and it writes a clean double-entry record for you to approve.</p>
          <div className="ctarow">
            <button className="btn ghost big" onClick={() => goTo('how')}>▷ See how it works</button>
            <button className="btn big" onClick={() => router.push('/app/')}>Start bookkeeping →</button>
          </div>
          <div className="langs"><span>English</span><span>हिन्दी</span><span>ਪੰਜਾਬੀ</span></div>
        </div>

        <div className="hr" aria-hidden="true">
          <svg className="swirl" viewBox="0 0 520 420" preserveAspectRatio="xMidYMid meet">
            {ELLIPSES.map(([rx, ry]) => (
              <ellipse key={rx} cx="260" cy="210" rx={rx} ry={ry} transform="rotate(-18 260 210)" />
            ))}
          </svg>
          <div className="phone">
            <div className="scr">
              <div className="sb">VoxLedger <small>Today</small></div>
              <div className="sw">{BARS.map((h, i) => <i key={i} style={{ height: h }} />)}</div>
              <div className="pm">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" /></svg>
              </div>
              <div className="sq">“kal 2 hazar kiraya diya”</div>
              <div className="si"><span>Rent</span><b className="out">− ₹2,000</b></div>
              <div className="si"><span>Ramu</span><b className="in">+ ₹5,000</b></div>
              <div className="si"><span>Electricity</span><b className="out">− ₹3,500</b></div>
            </div>
          </div>
          <div className="float fc">Heard and recorded<br /><b>+ ₹5,000 Sales</b></div>
          <div className="float fb">✔ Balanced double entry<br /><b>Dr Cash · Cr Sales</b></div>
        </div>
      </div>
    </section>
  );
}

'use client';
import { useRouter } from 'next/navigation';

export default function Cta() {
  const router = useRouter();
  const open = () => router.push('/app/');
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="lwrap">
        <div className="cta">
          <svg className="rings" viewBox="0 0 520 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            {[60, 100, 140, 180, 220].map((r) => <circle key={r} cx="260" cy="210" r={r} />)}
          </svg>
          <h2 className="h2">Transform your bahi with <span>next-gen voice bookkeeping</span></h2>
          <p className="intro" style={{ color: '#B9CCF2' }}>Open VoxLedger and record your first entry in under a minute.</p>
          <div className="ctarow">
            <button className="btn big light" onClick={open}>Start bookkeeping →</button>
            <button className="btn big ghost" style={{ color: '#fff', borderColor: '#fff', background: 'transparent' }} onClick={open}>Book a demo</button>
          </div>
        </div>
      </div>
    </section>
  );
}

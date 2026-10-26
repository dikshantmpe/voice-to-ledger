'use client';
import { useRouter } from 'next/navigation';

export default function WhyVox() {
  const router = useRouter();
  return (
    <section className="sec" id="why">
      <div className="lwrap split">
        <div>
          <span className="eyebrow">Ideal for busy counters</span>
          <h2 className="h2">VoxLedger is ideal for <span>everyday shop work</span></h2>
          <ul className="ticks">
            <li><span><b>Hands-free entry.</b> Record a sale while you are serving the next customer.</span></li>
            <li><span><b>Mixed language.</b> Hinglish, Hindi and Punjabi phrases all parse correctly.</span></li>
            <li><span><b>Nothing lost.</b> Drafts are kept on the device when you are offline and sync later.</span></li>
          </ul>
          <button className="btn" onClick={() => router.push('/app/')}>Try it with sample data →</button>
        </div>
        <div className="phone sm2">
          <div className="scr" style={{ paddingTop: '1.6rem' }}>
            <div className="sb">Review <small>2 waiting</small></div>
            <div className="si" style={{ flexDirection: 'column', gap: '.3rem' }}>
              <b>Ramu</b>
              <span style={{ color: '#5B6B8C', fontWeight: 600 }}>“aaj Ramu ko 5000 ka maal becha”</span>
              <b className="in">+ ₹5,000</b>
            </div>
            <div className="si" style={{ flexDirection: 'column', gap: '.3rem' }}>
              <b>— no party —</b>
              <span style={{ color: '#5B6B8C', fontWeight: 600 }}>“becha 2500”</span>
              <span style={{ color: '#B9650F' }}>⚑ Missing customer name</span>
            </div>
            <button className="btn sm" style={{ marginTop: 'auto' }}>✔ Approve</button>
          </div>
        </div>
      </div>
    </section>
  );
}

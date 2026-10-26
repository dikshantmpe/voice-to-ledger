'use client';
import { useRouter } from 'next/navigation';

export default function LandingNav({ goTo }) {
  const router = useRouter();
  return (
    <nav className="lnav">
      <div className="lin">
        <span className="brand"><span className="logo" /><span>VoxLedger</span></span>
        <div className="links">
          <button onClick={() => goTo('how')}>How it works</button>
          <button onClick={() => goTo('why')}>Why VoxLedger</button>
          <button onClick={() => goTo('analytics')}>Analytics</button>
        </div>
        <button className="btn sm light" onClick={() => router.push('/app/')}>Open app</button>
      </div>
    </nav>
  );
}

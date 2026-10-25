'use client';
import LandingNav from './LandingNav';
import Hero from './Hero';
import HowItWorks from './HowItWorks';
import WhyVox from './WhyVox';
import Features from './Features';
import Analytics from './Analytics';
import Cta from './Cta';
import LandingFooter from './LandingFooter';

export default function Landing() {
  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div id="landing">
      <LandingNav goTo={goTo} />
      <Hero goTo={goTo} />
      <HowItWorks />
      <WhyVox />
      <Features />
      <Analytics />
      <Cta />
      <LandingFooter />
    </div>
  );
}

import { Manrope } from 'next/font/google';
import '@/styles/base.css';
import '@/styles/topbar.css';
import '@/styles/app.css';
import '@/styles/theme.css';
import '@/styles/landing.css';
import '@/styles/review.css';
import '@/styles/assistant.css';

const manrope = Manrope({ subsets: ['latin'], weight: ['500', '700', '800'], display: 'swap' });

export const metadata = {
  title: 'VoxLedger — Voice Bookkeeping',
  description: 'Voice-first bookkeeping for small businesses',
  icons: { icon: '/logo.jpg' },
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0B1B4B' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className={manrope.className}>
      <body>{children}</body>
    </html>
  );
}

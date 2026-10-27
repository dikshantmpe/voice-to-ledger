'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AppProvider } from '@/context/AppContext';
import TopBar, { BottomNav } from '@/components/topbar/TopBar';
import HomeView from '@/components/home/HomeView';
import RecordView from '@/components/record/RecordView';
import ReviewView from '@/components/review/ReviewView';
import LedgerView from '@/components/ledger/LedgerView';
import PartiesView from '@/components/parties/PartiesView';
import ReportsView from '@/components/reports/ReportsView';
import AssistantMode from '@/components/assistant/AssistantMode';
import DailySummary from '@/components/summary/DailySummary';
import Toast from '@/components/ui/Toast';

function Shell() {
  const [view, setView] = useState('home');
  const [showSummary, setShowSummary] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <>
      <TopBar view={view} setView={setView} onSummary={() => setShowSummary(true)} onAssistant={() => setShowAssistant(true)} />
      <BottomNav view={view} setView={setView} />

      <main className="wrap">
        {view === 'home' && <HomeView goRecord={() => setView('record')} goReview={() => setView('review')} goLedger={() => setView('ledger')} />}
        {view === 'record' && <RecordView goReview={() => setView('review')} />}
        {view === 'review' && <ReviewView goRecord={() => setView('record')} />}
        {view === 'ledger' && <LedgerView />}
        {view === 'parties' && <PartiesView />}
        {view === 'reports' && <ReportsView />}
      </main>

      <DailySummary open={showSummary} onClose={() => setShowSummary(false)} />
      <AssistantMode open={showAssistant} onClose={() => setShowAssistant(false)} />
      <Toast />
    </>
  );
}

export default function AppShell() {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (getSession()) setOk(true);
    else router.replace('/login/');
  }, [router]);

  if (!ok) return null;
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
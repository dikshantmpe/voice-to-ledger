'use client';
import { useState } from 'react';
import { AppProvider } from '@/context/AppContext';
import TopBar from '@/components/topbar/TopBar';
import BottomNav from '@/components/topbar/BottomNav';
import RecordView from '@/components/record/RecordView';
import ReviewView from '@/components/review/ReviewView';
import LedgerView from '@/components/ledger/LedgerView';
import AssistantMode from '@/components/assistant/AssistantMode';
import DailySummary from '@/components/summary/DailySummary';
import Toast from '@/components/ui/Toast';

function Shell() {
  const [view, setView] = useState('record');
  const [showSummary, setShowSummary] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <>
      <TopBar view={view} setView={setView} onSummary={() => setShowSummary(true)} onAssistant={() => setShowAssistant(true)} />
      <BottomNav view={view} setView={setView} />

      <main className="wrap">
        {view === 'record' && <RecordView goReview={() => setView('review')} />}
        {view === 'review' && <ReviewView goRecord={() => setView('record')} />}
        {view === 'ledger' && <LedgerView />}
      </main>

      <DailySummary open={showSummary} onClose={() => setShowSummary(false)} />
      <AssistantMode open={showAssistant} onClose={() => setShowAssistant(false)} />
      <Toast />
    </>
  );
}

export default function AppShell() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

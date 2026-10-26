'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import PinLogin from '@/components/auth/PinLogin';
import { getUser } from '@/lib/api';

export default function AppPage() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
    setReady(true);
  }, []);

  if (!ready) return null;
  // Reload after login so AppProvider fetches this user's entries.
  if (!user) return <PinLogin onDone={() => window.location.reload()} />;
  return <AppShell />;
}
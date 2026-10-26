'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { seed } from '@/lib/seed';
import { makeT, speechLangOf } from '@/lib/i18n';
import { todayISO } from '@/lib/format';
import { api, fromParsed, toUi, accountsFor, getUser, NetworkError } from '@/lib/api';

const LS = 'voxledger_next_v1';
const OUTBOX = 'voxledger_outbox_v1';
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const readOutbox = () => {
  try { return JSON.parse(localStorage.getItem(OUTBOX)) || []; } catch (e) { return []; }
};
const writeOutbox = (q) => localStorage.setItem(OUTBOX, JSON.stringify(q));

export function AppProvider({ children }) {
  const [S, setS] = useState(null);
  const [toastMsg, setToast] = useState('');
  const [online, setOnline] = useState(true);

  // Settings stay local. Entries always come from the server.
  useEffect(() => {
    let local = null;
    try { local = JSON.parse(localStorage.getItem(LS)); } catch (e) {}
    setS({ ...(local || seed()), entries: [] });
  }, []);

  useEffect(() => {
    if (S) localStorage.setItem(LS, JSON.stringify({ ...S, entries: [] }));
  }, [S]);

  useEffect(() => {
    if (!toastMsg) return;
    const id = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(id);
  }, [toastMsg]);

  const toast = useCallback((m) => setToast(m), []);

  // Retry entries that were recorded while offline. Nothing is dropped; failed items stay queued.
  const flushOutbox = useCallback(async () => {
    const q = readOutbox();
    if (!q.length) return;
    const left = [];
    for (const item of q) {
      try {
        const parsed = await api.parse(item.text);
        await api.createEntry(fromParsed(parsed, item.text));
      } catch (e) {
        left.push(item);
      }
    }
    writeOutbox(left);
    if (left.length) toast(`${left.length} entry(ies) still waiting to sync`);
  }, [toast]);

  const refresh = useCallback(async () => {
    if (!getUser()) return;
    try {
      await flushOutbox();
      const rows = await api.listEntries();
      setS((s) => (s ? { ...s, entries: rows.map(toUi) } : s));
      setOnline(true);
    } catch (e) {
      if (e instanceof NetworkError) setOnline(false);
    }
  }, [flushOutbox]);

  useEffect(() => { refresh(); }, [refresh]);

  const replaceRow = (row) =>
    setS((s) => (s ? { ...s, entries: s.entries.map((e) => (e.id === row.id ? toUi(row) : e)) } : s));

  const setLang = (l) => setS((s) => ({ ...s, lang: l }));
  const setVoiceLang = (v) => setS((s) => ({ ...s, voiceLang: v }));
  const lang = S ? S.lang : 'en';
  const t = useMemo(() => makeT(lang), [lang]);
  const speechLang = speechLangOf(lang);

  // Record -> /parse -> /entries. The entry shows a placeholder until the server answers.
  const addEntry = (text) => {
    const tmpId = `tmp-${Date.now()}`;
    const placeholder = {
      id: tmpId, date: todayISO(), phrase: text, party: '', amount: null, dir: null,
      nature: 'Other', status: 'pending', conf: 0, flags: ['Processing'], lines: [],
    };
    const drop = () => setS((s) => (s ? { ...s, entries: s.entries.filter((e) => e.id !== tmpId) } : s));
    setS((s) => (s ? { ...s, entries: [placeholder, ...s.entries] } : s));

    (async () => {
      try {
        const parsed = await api.parse(text);
        const row = await api.createEntry(fromParsed(parsed, text));
        setS((s) => (s ? { ...s, entries: s.entries.map((e) => (e.id === tmpId ? toUi(row) : e)) } : s));
      } catch (err) {
        drop();
        if (err instanceof NetworkError) {
          writeOutbox([...readOutbox(), { text, savedAt: Date.now() }]);
          setOnline(false);
          toast('No network. Saved on this phone, will sync when online.');
        } else if (err.status === 422) {
          toast(err.message);
        } else {
          toast(`Could not save: ${err.message}`);
        }
      }
    })();
    return placeholder;
  };

  // Approve, reject: optimistic update, rolled back on failure.
  const runAction = async (id, optimisticStatus, request) => {
    const before = S?.entries.find((e) => e.id === id);
    if (!before) return;
    setS((s) => (s ? { ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, status: optimisticStatus } : e)) } : s));
    try {
      replaceRow(await request());
    } catch (err) {
      setS((s) => (s ? { ...s, entries: s.entries.map((e) => (e.id === id ? before : e)) } : s));
      if (err instanceof NetworkError) {
        setOnline(false);
        toast('No network. Try again when online.');
      } else {
        toast(err.message);
      }
    }
  };

  const approve = (id) => runAction(id, 'approved', () => api.approve(id));
  const reject = (id) => runAction(id, 'rejected', () => api.reject(id));
  // The backend has no "restore" endpoint, so a rejected entry cannot be reopened yet.
  const restore = () => toast('Restore is not available yet');

  // Edit: sends the changed fields to PATCH /entries/{id}. Backend clears needs_review on save.
  const updateEntry = async (id, patch) => {
    const cur = S?.entries.find((e) => e.id === id);
    if (!cur) return;
    const next = { ...cur, ...patch };
    const body = {
      party: next.party || null,
      amount: next.amount || null,
      entry_date: next.date,
      ...accountsFor(next.dir, next.nature),
    };
    try {
      replaceRow(await api.patchEntry(id, body));
    } catch (err) {
      toast(err instanceof NetworkError ? 'No network. Edit not saved.' : err.message);
    }
  };

  const bulkApproveClean = () => {
    const ids = (S?.entries || [])
      .filter((e) => e.status === 'pending' && !e.flags.length && e.conf >= 0.75)
      .map((e) => e.id);
    ids.forEach((id) => approve(id));
    return ids.length;
  };

  const pending = S ? S.entries.filter((e) => e.status === 'pending') : [];

  const summary = useMemo(() => {
    if (!S) return null;
    const d = todayISO();
    const today = S.entries.filter((e) => e.status === 'approved' && e.date === d);
    const inAmt = today.filter((e) => e.dir === 'in').reduce((a, e) => a + (e.amount || 0), 0);
    const outAmt = today.filter((e) => e.dir === 'out').reduce((a, e) => a + (e.amount || 0), 0);
    let dr = 0, cr = 0;
    S.entries.filter((e) => e.status === 'approved').forEach((e) => e.lines.forEach((l) => { dr += l.d || 0; cr += l.c || 0; }));
    const allApproved = S.entries.filter((e) => e.status === 'approved');
    const cashNet = allApproved.reduce((a, e) => a + (e.dir === 'in' ? e.amount || 0 : -(e.amount || 0)), 0);
    return { inAmt, outAmt, net: inAmt - outAmt, count: today.length, pending: pending.length, cash: S.biz.cash + cashNet, dr, cr };
  }, [S, pending.length]);

  if (!S) return null;
  return (
    <Ctx.Provider value={{
      S, lang, t, speechLang, setLang, setVoiceLang, addEntry, approve, reject, restore,
      updateEntry, bulkApproveClean, pending, summary, toast, toastMsg, online,
    }}>
      {children}
    </Ctx.Provider>
  );
}
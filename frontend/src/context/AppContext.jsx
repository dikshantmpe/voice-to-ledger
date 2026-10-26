'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { seed } from '@/lib/seed';
import { parseEntry } from '@/lib/parser';
import { makeT, speechLangOf } from '@/lib/i18n';
import { todayISO } from '@/lib/format';

const LS = 'voxledger_next_v2';
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [S, setS] = useState(null);       // null until loaded from localStorage (avoids SSR mismatch)
  const [toastMsg, setToast] = useState('');

  useEffect(() => {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(LS)); } catch (e) {}
    setS(data || seed());
  }, []);

  useEffect(() => {
    if (S) localStorage.setItem(LS, JSON.stringify(S));
  }, [S]);

  useEffect(() => {
    if (!toastMsg) return;
    const id = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(id);
  }, [toastMsg]);

  const toast = useCallback((m) => setToast(m), []);
  const lang = S ? S.lang : 'en';
  const t = useMemo(() => makeT(lang), [lang]);
  const speechLang = speechLangOf(lang);

  const setLang = (l) => setS((s) => ({ ...s, lang: l }));
  const setVoiceLang = (v) => setS((s) => ({ ...s, voiceLang: v }));

  const addEntry = (text) => {
    const p = parseEntry(text, S.parties);
    const e = { id: S.nextId, date: p.date, phrase: text, party: p.party, amount: p.amount, dir: p.dir, nature: p.nature, status: 'pending', conf: p.conf, flags: p.flags, lines: p.lines };
    setS((s) => ({ ...s, entries: [e, ...s.entries], nextId: s.nextId + 1 }));
    return e;
  };

  const setStatus = (id, status, extra = {}) =>
    setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, status, ...extra } : e)) }));
  const approve = (id) => setStatus(id, 'approved');
  const reject = (id) => setStatus(id, 'rejected');
  const restore = (id) => setStatus(id, 'pending');

  // edit one entry: rebuilds the double-entry lines from party/amount/dir/nature
  const updateEntry = (id, patch) =>
    setS((s) => ({
      ...s,
      entries: s.entries.map((e) => {
        if (e.id !== id) return e;
        const n = { ...e, ...patch };
        const flags = [];
        if (!n.amount) flags.push('Missing amount');
        if (!n.dir) flags.push('Unclear direction');
        if (!n.party && (n.nature === 'Sales' || n.nature === 'Purchases')) flags.push('Missing customer name');
        n.flags = flags;
        n.lines = n.amount && n.dir
          ? n.dir === 'in'
            ? [{ a: 'Cash', d: n.amount, c: 0 }, { a: n.nature, d: 0, c: n.amount }]
            : [{ a: n.nature === 'Other' ? 'Purchases' : n.nature, d: n.amount, c: 0 }, { a: 'Cash', d: 0, c: n.amount }]
          : [];
        return n;
      }),
    }));

  const bulkApproveClean = () => {
    let n = 0;
    setS((s) => ({ ...s, entries: s.entries.map((e) => { if (e.status === 'pending' && !e.flags.length && e.conf >= 0.75) { n++; return { ...e, status: 'approved' }; } return e; }) }));
    return n;
  };

  // add a customer / supplier (returns false if the name is empty or already exists)
  const addParty = (n, type, open) => {
    const name = (n || '').trim();
    if (!name || S.parties.some((p) => p.n.toLowerCase() === name.toLowerCase())) return false;
    setS((s) => ({ ...s, parties: [...s.parties, { n: name, t: type, open: +open || 0 }] }));
    return true;
  };

  const pending = S ? S.entries.filter((e) => e.status === 'pending') : [];

  // numbers for the daily-summary icon
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
    <Ctx.Provider value={{ S, lang, t, speechLang, setLang, setVoiceLang, addEntry, approve, reject, restore, updateEntry, bulkApproveClean, addParty, pending, summary, toast, toastMsg }}>
      {children}
    </Ctx.Provider>
  );
}

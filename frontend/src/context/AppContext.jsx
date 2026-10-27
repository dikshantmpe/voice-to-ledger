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
  const [S, setS] = useState(null);
  const [toastMsg, setToast] = useState('');

  // Helper for API headers (Update this based on your auth method)
  const getHeaders = () => {
    // const token = localStorage.getItem('token'); 
    return {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}` 
    };
  };

  // 1. Load initial state (parties/lang) from local storage, then fetch real entries from API
  useEffect(() => {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(LS)); } catch (e) {}
    const initialState = data || seed();
    setS(initialState);

    async function fetchEntries() {
      try {
        const res = await fetch('/entries', { headers: getHeaders() });
        if (res.ok) {
          const entries = await res.json();
          // Map backend fields to frontend format if necessary, or use directly
          setS(prev => ({ 
            ...prev, 
            entries: entries,
            nextId: entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : prev.nextId
          }));
        }
      } catch (err) {
        console.error("Failed to load entries from API", err);
      }
    }
    fetchEntries();
  }, []);

  // Save non-entry state (like parties and language) to local storage
  useEffect(() => {
    if (S) {
      const stateToSave = { ...S, entries: [] }; // Don't cache entries locally anymore
      localStorage.setItem(LS, JSON.stringify(stateToSave));
    }
  }, [S?.parties, S?.lang, S?.voiceLang]);

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

  // 2. Add entry via POST API
  const addEntry = async (text) => {
    const p = parseEntry(text, S.parties);
    const payload = {
      entry_date: p.date || todayISO(),
      party: p.party || null,
      debit_account: p.dir === 'in' ? 'Cash' : (p.nature || 'Purchases'),
      credit_account: p.dir === 'in' ? (p.nature || 'Sales') : 'Cash',
      amount: p.amount || 0,
      narration: text,
      raw_utterance: text,
      confidence: p.conf,
      needs_review: (p.flags && p.flags.length > 0) ? true : false
    };

    try {
      const res = await fetch('/entries', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedEntry = await res.json();
        setS((s) => ({ ...s, entries: [savedEntry, ...s.entries], nextId: s.nextId + 1 }));
        return savedEntry;
      } else {
        toast('Failed to save entry to database');
      }
    } catch (e) {
      toast('Network error saving entry');
    }
  };

  // 3. Approve entry via POST API
  const approve = async (id) => {
    try {
      const res = await fetch(`/entries/${id}/approve`, { 
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        const updated = await res.json();
        setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
      } else {
        const err = await res.json();
        toast(`Error approving: ${err.detail || 'Validation failed'}`);
      }
    } catch (e) {
      toast('Network error approving entry');
    }
  };

  // 4. Reject entry via POST API
  const reject = async (id) => {
    try {
      const res = await fetch(`/entries/${id}/reject`, { 
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        const updated = await res.json();
        setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
      }
    } catch (e) {
      toast('Network error rejecting entry');
    }
  };

  const restore = (id) => {
    // Note: Your backend entries.py doesn't have a /restore endpoint.
    // If needed, you should create a POST /entries/{id}/restore in FastAPI.
    // For now, this just updates local UI state.
    setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, status: 'pending' } : e)) }));
  };

  // 5. Update entry via PATCH API
  const updateEntry = async (id, patch) => {
    const backendPatch = {
      amount: patch.amount,
      party: patch.party,
      narration: patch.narration,
      entry_date: patch.date
    };

    try {
      const res = await fetch(`/entries/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(backendPatch)
      });
      if (res.ok) {
        const updated = await res.json();
        setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
      } else {
        toast('Failed to update entry');
      }
    } catch (e) {
      toast('Network error updating entry');
    }
  };

  const bulkApproveClean = async () => {
    const pendingClean = S.entries.filter((e) => e.status === 'pending' && !e.needs_review && (e.confidence >= 0.75 || e.confidence === null));
    let approvedCount = 0;
    
    // Process approvals sequentially to avoid overwhelming the database/API
    for (const entry of pendingClean) {
      const res = await fetch(`/entries/${entry.id}/approve`, { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        const updated = await res.json();
        setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === entry.id ? updated : e)) }));
        approvedCount++;
      }
    }
    if (approvedCount > 0) toast(`Bulk approved ${approvedCount} entries`);
    return approvedCount;
  };

  const addParty = (n, type, open) => {
    const name = (n || '').trim();
    if (!name || S.parties.some((p) => p.n.toLowerCase() === name.toLowerCase())) return false;
    setS((s) => ({ ...s, parties: [...s.parties, { n: name, t: type, open: +open || 0 }] }));
    return true;
  };

  const pending = S ? S.entries.filter((e) => e.status === 'pending') : [];

  const summary = useMemo(() => {
    if (!S) return null;
    const d = todayISO();
    const today = S.entries.filter((e) => e.status === 'approved' && e.entry_date === d);
    // Adjusted logic to use API's debit_account/credit_account structure
    const inAmt = today.filter((e) => e.debit_account === 'Cash').reduce((a, e) => a + Number(e.amount || 0), 0);
    const outAmt = today.filter((e) => e.credit_account === 'Cash').reduce((a, e) => a + Number(e.amount || 0), 0);
    
    let dr = 0, cr = 0;
    S.entries.filter((e) => e.status === 'approved').forEach((e) => {
      dr += Number(e.amount || 0); 
      cr += Number(e.amount || 0);
    });
    
    const allApproved = S.entries.filter((e) => e.status === 'approved');
    const cashNet = allApproved.reduce((a, e) => {
      if (e.debit_account === 'Cash') return a + Number(e.amount || 0);
      if (e.credit_account === 'Cash') return a - Number(e.amount || 0);
      return a;
    }, 0);
    
    return { inAmt, outAmt, net: inAmt - outAmt, count: today.length, pending: pending.length, cash: (S.biz?.cash || 0) + cashNet, dr, cr };
  }, [S, pending.length]);

  if (!S) return null;
  return (
    <Ctx.Provider value={{ S, lang, t, speechLang, setLang, setVoiceLang, addEntry, approve, reject, restore, updateEntry, bulkApproveClean, addParty, pending, summary, toast, toastMsg }}>
      {children}
    </Ctx.Provider>
  );
}
'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { seed } from '@/lib/seed';
import { parseEntry } from '@/lib/parser';
import { api, toUi, fromParsed, accountsFor } from '@/lib/api';
import { makeT, speechLangOf } from '@/lib/i18n';
import { todayISO } from '@/lib/format';
import TopBar, { BottomNav } from '@/components/topbar/TopBar';

const LS = 'voxledger_next_v2';
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [S, setS] = useState(null);
  const [toastMsg, setToast] = useState('');

  // 1. Load initial state (parties/lang) from local storage, then fetch real entries from the API
  useEffect(() => {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(LS)); } catch (e) {}
    const initialState = data || seed();
    setS(initialState);

    async function fetchEntries() {
      try {
        const entries = await api.listEntries(); // backend EntryOut[]
        const ids = entries.map((e) => e.id);
        setS((prev) => ({
          ...prev,
          entries: entries.map(toUi), // convert to the UI shape all components expect
          nextId: ids.length > 0 ? Math.max(...ids) + 1 : prev.nextId,
        }));
      } catch (err) {
        // offline / backend down -> keep the local (seeded) entries
        console.error('Failed to load entries from API', err);
      }
    }
    fetchEntries();
  }, []);

  // Save non-entry state (like parties and language) to local storage
  useEffect(() => {
    if (S) {
      const stateToSave = { ...S, entries: [] }; // entries live on the server
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

  // 2. Add entry: backend Gemini extraction first, local parser as fallback.
  //    If the server is unreachable the entry is kept in local state (offline mode).
  const addEntry = async (text) => {
    let payload = null;

    // a) core flow: backend /parse (multilingual NLU)
    try {
      const parsed = await api.parse(text);
      payload = fromParsed(parsed, text);
    } catch (e) {
      // b) fallback: local rule-based parser (works offline)
      const p = parseEntry(text, S.parties);
      const acc = p.dir ? accountsFor(p.dir, p.nature) : null;
      payload = {
        entry_date: p.date || todayISO(),
        party: p.party || null,
        debit_account: acc ? acc.debit_account : 'Cash',
        credit_account: acc ? acc.credit_account : 'Sales',
        amount: p.amount ?? null,
        narration: text,
        raw_utterance: text,
        confidence: p.conf,
        needs_review: !!(p.flags && p.flags.length > 0),
      };
    }

    // c) post the draft to the backend
    try {
      const saved = await api.createEntry(payload);
      const ui = toUi(saved);
      setS((s) => ({ ...s, entries: [ui, ...s.entries], nextId: Math.max(s.nextId, saved.id + 1) }));
      return ui;
    } catch (e) {
      // d) fully offline: keep the draft locally so nothing is lost
      const local = toUi({ ...payload, id: S.nextId, status: 'pending' });
      setS((s) => ({ ...s, entries: [local, ...s.entries], nextId: s.nextId + 1 }));
      toast(e?.message || 'Offline: entry kept on this device');
      return local;
    }
  };

  // 3. Approve entry via API
  const approve = async (id) => {
    try {
      const updated = await api.approve(id);
      setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? toUi(updated) : e)) }));
    } catch (e) {
      toast(e?.message || 'Error approving entry');
    }
  };

  // 4. Reject entry via API
  const reject = async (id) => {
    try {
      const updated = await api.reject(id);
      setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? toUi(updated) : e)) }));
    } catch (e) {
      toast(e?.message || 'Network error rejecting entry');
    }
  };

  const restore = (id) => {
    // No /restore endpoint on the backend yet; local-only until then.
    setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, status: 'pending' } : e)) }));
  };

  // 5. Update entry via PATCH (dir/nature changes recompute the debit/credit sides)
  const updateEntry = async (id, patch) => {
    const body = {};
    if (patch.date) body.entry_date = patch.date;
    if (patch.party !== undefined) body.party = patch.party;
    if (patch.narration !== undefined) body.narration = patch.narration;
    if (patch.amount !== undefined) body.amount = patch.amount;
    if (patch.dir) {
      const nature = patch.nature || (S.entries.find((e) => e.id === id) || {}).nature;
      const acc = accountsFor(patch.dir, nature);
      body.debit_account = acc.debit_account;
      body.credit_account = acc.credit_account;
    }

    try {
      const updated = await api.patchEntry(id, body);
      setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? toUi(updated) : e)) }));
    } catch (e) {
      toast(e?.message || 'Failed to update entry');
    }
  };

  const bulkApproveClean = async () => {
    const pendingClean = S.entries.filter((e) => e.status === 'pending' && !e.needs_review && (e.conf == null || e.conf >= 0.75));
    let approvedCount = 0;

    // Sequential to avoid hammering the API
    for (const entry of pendingClean) {
      try {
        const updated = await api.approve(entry.id);
        setS((s) => ({ ...s, entries: s.entries.map((e) => (e.id === entry.id ? toUi(updated) : e)) }));
        approvedCount++;
      } catch (e) { /* keep going */ }
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
    const today = S.entries.filter((e) => e.status === 'approved' && e.date === d);
    const inAmt = today.filter((e) => e.dir === 'in').reduce((a, e) => a + Number(e.amount || 0), 0);
    const outAmt = today.filter((e) => e.dir === 'out').reduce((a, e) => a + Number(e.amount || 0), 0);

    const allApproved = S.entries.filter((e) => e.status === 'approved');
    const cashNet = allApproved.reduce((a, e) => {
      if (e.dir === 'in') return a + Number(e.amount || 0);
      return a - Number(e.amount || 0);
    }, 0);

    return { inAmt, outAmt, net: inAmt - outAmt, count: today.length, pending: pending.length, cash: (S.biz?.cash || 0) + cashNet, dr: inAmt, cr: outAmt };
  }, [S, pending.length]);

  if (!S) return null;
  return (
    <Ctx.Provider value={{ S, lang, t, speechLang, setLang, setVoiceLang, addEntry, approve, reject, restore, updateEntry, bulkApproveClean, addParty, pending, summary, toast, toastMsg }}>
      {children}
    </Ctx.Provider>
  );
}
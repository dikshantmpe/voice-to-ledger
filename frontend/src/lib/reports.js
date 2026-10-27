import { fmt } from '@/lib/format';

// Party balances from approved entries. bal > 0 means the party owes us.
export function partyRows(entries, parties) {
  const approved = entries.filter((e) => e.status === 'approved' && e.party);
  const map = new Map(
    (parties || []).map((p) => [p.n.toLowerCase(), { n: p.n, t: p.t, open: p.open || 0 }])
  );
  approved.forEach((e) => {
    const k = e.party.toLowerCase();
    if (!map.has(k)) map.set(k, { n: e.party, t: e.dir === 'in' ? 'Customer' : 'Supplier', open: 0 });
  });
  return [...map.values()]
    .map((p) => {
      const tx = approved.filter((e) => e.party.toLowerCase() === p.n.toLowerCase());
      const inA = tx.filter((e) => e.dir === 'in').reduce((a, e) => a + (e.amount || 0), 0);
      const outA = tx.filter((e) => e.dir === 'out').reduce((a, e) => a + (e.amount || 0), 0);
      return { ...p, tx, bal: p.open + inA - outA };
    })
    .sort((a, b) => Math.abs(b.bal) - Math.abs(a.bal));
}

// Customers who still owe money
export function pendingCollections(rows) {
  return rows.filter((p) => p.t !== 'Supplier' && p.bal > 0);
}

// Trial balance from the double-entry lines of approved entries.
export function trialBalance(entries) {
  const acc = new Map();
  entries
    .filter((e) => e.status === 'approved')
    .forEach((e) => {
      (e.lines || []).forEach((l) => {
        const row = acc.get(l.a) || { account: l.a, debit: 0, credit: 0 };
        row.debit += Number(l.d) || 0;
        row.credit += Number(l.c) || 0;
        acc.set(l.a, row);
      });
    });
  const rows = [...acc.values()].sort((a, b) => b.debit + b.credit - (a.debit + a.credit));
  const debit = rows.reduce((s, r) => s + r.debit, 0);
  const credit = rows.reduce((s, r) => s + r.credit, 0);
  return { rows, debit, credit, balanced: Math.round(debit) === Math.round(credit) };
}

// Plain-text summary used for WhatsApp sharing
export function reportText(tb, pending) {
  const lines = ['VoxLedger trial balance'];
  tb.rows.forEach((r) => lines.push(`${r.account}: Dr ${fmt(r.debit)} / Cr ${fmt(r.credit)}`));
  lines.push(`Total: Dr ${fmt(tb.debit)} / Cr ${fmt(tb.credit)}`);
  if (pending.length) {
    lines.push('Pending collections:');
    pending.forEach((p) => lines.push(`${p.n}: ${fmt(p.bal)}`));
  }
  return lines.join('\n');
}

// CSV helpers
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export const toCSV = (header, rows) =>
  [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');

export function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
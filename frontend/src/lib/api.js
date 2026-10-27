export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const USER_KEY = 'voxledger_user';

export const ACCOUNTS = ['Cash', 'Debtors', 'Creditors', 'Sales', 'Purchases', 'Wages', 'Rent', 'Electricity'];

export class NetworkError extends Error {}

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
};
export const saveUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));

async function call(path, { method = 'GET', body } = {}) {
  const user = getUser();
  const headers = { 'X-Demo-User': user?.phone || '' };
  if (body) headers['Content-Type'] = 'application/json';
  let r;
  try {
    r = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new NetworkError('network');
  }
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    const err = new Error(typeof j.detail === 'string' ? j.detail : `Request failed (${r.status})`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

// Frontend "dir/nature" -> backend accounts.
// in  = money came in:  Cash debit, nature credit (Sales, Debtors)
// out = money went out: nature debit (Purchases, Rent...), Cash credit
export function accountsFor(dir, nature) {
  const n = ACCOUNTS.includes(nature) ? nature : dir === 'in' ? 'Sales' : 'Purchases';
  return dir === 'in'
    ? { debit_account: 'Cash', credit_account: n }
    : { debit_account: n, credit_account: 'Cash' };
}

// Backend EntryOut -> shape the existing UI components expect
export function toUi(e) {
  const isIn = e.debit_account === 'Cash';
  const nature = isIn ? e.credit_account : e.debit_account;
  const amount = e.amount == null ? null : Number(e.amount);
  const flags = [];
  if (e.needs_review) flags.push('Needs review');
  if (!amount) flags.push('Missing amount');
  if (!e.party && (nature === 'Sales' || nature === 'Purchases')) flags.push('Missing customer name');
  const lines = amount
    ? isIn
      ? [{ a: 'Cash', d: amount, c: 0 }, { a: nature, d: 0, c: amount }]
      : [{ a: nature, d: amount, c: 0 }, { a: 'Cash', d: 0, c: amount }]
    : [];
  return {
    id: e.id,
    date: e.entry_date,
    phrase: e.narration || '',
    party: e.party || '',
    amount,
    dir: isIn ? 'in' : 'out',
    nature,
    status: e.status,
    conf: e.confidence ?? 0,
    flags,
    lines,
  };
}

// Backend /parse result -> body for POST /entries
export function fromParsed(p, raw) {
  return {
    entry_date: p.entry_date,
    party: p.party,
    debit_account: p.debit_account,
    credit_account: p.credit_account,
    amount: p.amount,
    narration: p.narration || raw,
    raw_utterance: raw,
    confidence: p.confidence,
    needs_review: p.needs_review,
  };
}

export const api = {
  parse: (text) => call('/parse', { method: 'POST', body: { text } }),
  createEntry: (body) => call('/entries', { method: 'POST', body }),
  listEntries: () => call('/entries'),
  patchEntry: (id, body) => call(`/entries/${id}`, { method: 'PATCH', body }),
  approve: (id) => call(`/entries/${id}/approve`, { method: 'POST' }),
  reject: (id) => call(`/entries/${id}/reject`, { method: 'POST' }),
  ledger: () => call('/ledger'),
};
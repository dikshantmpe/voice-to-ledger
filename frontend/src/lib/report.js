import { dateLabel, fmt } from './format';

const MAX_ROWS = 30; // keep the WhatsApp text short; the CSV has everything

// Text report for WhatsApp / copy / native share
export function buildLedgerText({ biz, rows, dr, cr, cash, t }) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [`*VoxLedger · ${biz}*`, `${t('share_ledger')} · ${today}`, ''];
  rows.slice(0, MAX_ROWS).forEach((e) => {
    const sign = e.dir === 'in' ? '+' : '−';
    lines.push(`${dateLabel(e.date)} · ${e.party ? e.party + ' · ' : ''}${e.nature} · ${sign}${fmt(e.amount)}`);
  });
  if (rows.length > MAX_ROWS) lines.push(`… +${rows.length - MAX_ROWS} ${t('share_more')}`);
  lines.push('', `${t('led_totdr')}: ${fmt(dr)}`, `${t('led_totcr')}: ${fmt(cr)}`, dr === cr ? t('led_balanced') : `${t('led_diff')} ${fmt(Math.abs(dr - cr))}`, `${t('sum_cash')}: ${fmt(cash)}`);
  return lines.join('\n');
}

export function buildLedgerCsv(rows) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Date', 'Party', 'Narration', 'Debit account', 'Credit account', 'Amount'];
  const body = rows.map((e) => {
    const d = e.lines.find((l) => l.d > 0);
    const c = e.lines.find((l) => l.c > 0);
    return [e.date, e.party, e.phrase, d?.a, c?.a, e.amount].map(q).join(',');
  });
  return '\uFEFF' + [head.map(q).join(','), ...body].join('\r\n'); // BOM so Excel shows हिन्दी / ਪੰਜਾਬੀ correctly
}

export function buildSummaryText({ biz, s, t }) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    `*VoxLedger · ${biz}*`, `${t('share_daily')} · ${today}`, '',
    `${t('sum_in')}: ${fmt(s.inAmt)}`, `${t('sum_out')}: ${fmt(s.outAmt)}`, `${t('sum_net')}: ${fmt(s.net)}`,
    `${t('sum_cash')}: ${fmt(s.cash)}`, `${t('sum_entries')}: ${s.count}`, `${t('sum_pending')}: ${s.pending}`,
  ].join('\n');
}

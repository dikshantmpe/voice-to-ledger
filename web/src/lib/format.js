export const fmt = (n) => '₹' + (n == null ? 0 : Math.round(n)).toLocaleString('en-IN');
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const yesterdayISO = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
export function dateLabel(d) {
  if (d === todayISO()) return 'Today';
  if (d === yesterdayISO()) return 'Yesterday';
  return d;
}

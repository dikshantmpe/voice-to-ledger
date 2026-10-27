import { fmt } from '@/lib/format';

// Normalise an Indian phone number to wa.me format (91XXXXXXXXXX)
export function normalisePhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith('91')) return d;
  return d;
}

// Prefilled payment reminder for a customer who owes money
export function buildReminderLink({ phone, name, amount }) {
  const text =
    `Namaste ${name} ji, aapka ${fmt(amount)} pending hai. ` +
    `Kripya jald clear kar dein. Dhanyavaad.`;
  const num = normalisePhone(phone);
  const base = num ? `https://wa.me/${num}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

// Share any text (report summary) without a fixed number
export function buildShareLink(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
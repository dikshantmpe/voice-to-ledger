// Phone numbers for parties, kept in the browser (localStorage).
// Keyed by lower-cased party name so voice-created parties match too.
const KEY = 'vox_party_phones';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}

export const getPhone = (name) => load()[String(name).toLowerCase()] || '';

export function setPhone(name, phone) {
  const map = load();
  map[String(name).toLowerCase()] = String(phone || '').replace(/\D/g, '');
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) { /* storage full / disabled */ }
}
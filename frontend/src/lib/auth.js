// OTP login. Backend contract (NOT implemented on the backend yet):
//   POST {API_BASE}/auth/send-otp    { phone: "+91XXXXXXXXXX" }            -> 200
//   POST {API_BASE}/auth/verify-otp  { phone: "+91...", otp: "123456" }    -> 200 { token }
// Until those routes exist, ANY failure falls back to DEMO mode: OTP is 123456.
// This keeps login working in the deployed production build.
import { API_BASE, saveUser } from './api';

const KEY = 'voxledger_session';
const DEMO_OTP = '123456';
const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const isDemo = () => typeof window !== 'undefined' && sessionStorage.getItem('vox_demo_otp') === '1';

export async function sendOtp(phone) {
  sessionStorage.removeItem('vox_demo_otp');
  if (!API_BASE) { sessionStorage.setItem('vox_demo_otp', '1'); return; }
  try {
    const r = await fetch(`${API_BASE}/auth/send-otp`, json({ phone: '+91' + phone }));
    if (!r.ok) throw new Error('send failed');
  } catch (e) {
    // backend /auth routes not live yet -> demo mode (also covers network/CORS errors)
    sessionStorage.setItem('vox_demo_otp', '1');
  }
}

export async function verifyOtp(phone, otp) {
  if (isDemo()) {
    if (otp !== DEMO_OTP) throw new Error('bad otp');
    return { token: 'demo' };
  }
  const r = await fetch(`${API_BASE}/auth/verify-otp`, json({ phone: '+91' + phone, otp }));
  if (!r.ok) throw new Error('bad otp');
  const j = await r.json().catch(() => ({}));
  return { token: j.token || 'ok' };
}

export const getSession = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };

// Also persist the phone under the key lib/api.js reads, so every API call
// carries X-Demo-User: <phone> and entries land on the right user.
export const saveSession = (s) => {
  localStorage.setItem(KEY, JSON.stringify(s));
  if (s?.phone) saveUser({ phone: s.phone });
};
export const clearSession = () => {
  localStorage.removeItem(KEY);
  localStorage.removeItem('voxledger_user');
};
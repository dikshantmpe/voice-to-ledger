// OTP login. Backend contract (agree this with the backend dev):
//   POST {API_BASE}/auth/send-otp    { phone: "+91XXXXXXXXXX" }            -> 200
//   POST {API_BASE}/auth/verify-otp  { phone: "+91...", otp: "123456" }    -> 200 { token }
// While there is no backend (local dev), it falls back to DEMO mode: OTP is 123456.
import { API_BASE } from './voice';

const KEY = 'voxledger_session';
const DEMO_OTP = '123456';
const isDev = process.env.NODE_ENV !== 'production';
const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const isDemo = () => typeof window !== 'undefined' && sessionStorage.getItem('vox_demo_otp') === '1';

export async function sendOtp(phone) {
  sessionStorage.removeItem('vox_demo_otp');
  if (!API_BASE) { sessionStorage.setItem('vox_demo_otp', '1'); return; }
  try {
    const r = await fetch(`${API_BASE}/auth/send-otp`, json({ phone: '+91' + phone }));
    if (!r.ok) throw new Error('send failed');
  } catch (e) {
    // dev only: backend not running yet -> demo mode. In a production build this error is shown.
    if (isDev && e instanceof TypeError) { sessionStorage.setItem('vox_demo_otp', '1'); return; }
    throw e;
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
export const saveSession = (s) => localStorage.setItem(KEY, JSON.stringify(s));
export const clearSession = () => localStorage.removeItem(KEY);

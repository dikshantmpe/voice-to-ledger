'use client';
import { useState } from 'react';
import { saveUser } from '@/lib/api';

// Demo login. The phone number is the user key sent to the backend (X-Demo-User).
// The PIN is only checked on this device. Server-side auth comes later.
const PIN_KEY = 'voxledger_pins';

export default function PinLogin({ onDone }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) return setErr('Enter a 10-digit mobile number');
    if (!/^\d{4}$/.test(pin)) return setErr('PIN must be 4 digits');

    let pins = {};
    try { pins = JSON.parse(localStorage.getItem(PIN_KEY)) || {}; } catch (x) {}
    if (pins[phone] && pins[phone] !== pin) return setErr('Wrong PIN');
    pins[phone] = pin;
    localStorage.setItem(PIN_KEY, JSON.stringify(pins));

    saveUser({ phone });
    onDone();
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 360, margin: '60px auto', padding: 20, display: 'grid', gap: 12 }}>
      <h2>VoxLedger login</h2>
      <input
        inputMode="numeric"
        placeholder="Mobile number (10 digits)"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
        style={{ padding: 12, fontSize: 16 }}
      />
      <input
        inputMode="numeric"
        type="password"
        placeholder="4-digit PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        style={{ padding: 12, fontSize: 16 }}
      />
      {err && <div style={{ color: '#c00' }}>{err}</div>}
      <button type="submit" className="btn big">Login</button>
    </form>
  );
}
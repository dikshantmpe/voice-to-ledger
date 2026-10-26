'use client';
import { useRef } from 'react';

// 6 boxes: auto-advance, backspace goes back, paste a whole code.
export default function OtpInput({ value, onChange, length = 6 }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setAt = (i, d) => {
    const arr = digits.slice();
    arr[i] = d;
    onChange(arr.join(''));
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1].focus();
  };
  const onInput = (i, e) => {
    const d = e.target.value.replace(/\D/g, '').slice(-1);
    setAt(i, d);
    if (d && i < length - 1) refs.current[i + 1].focus();
  };
  const onPaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!p) return;
    e.preventDefault();
    onChange(p);
    refs.current[Math.min(p.length, length - 1)].focus();
  };

  return (
    <div className="otpbox" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} value={d} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1} aria-label={`OTP digit ${i + 1}`} onChange={(e) => onInput(i, e)} onKeyDown={(e) => onKey(i, e)} />
      ))}
    </div>
  );
}

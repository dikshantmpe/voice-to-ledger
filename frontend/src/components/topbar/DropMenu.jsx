'use client';
import { useEffect, useRef, useState } from 'react';

// Small dropdown: button + menu that closes on outside click.
export default function DropMenu({ trigger, className = '', children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  return (
    <div className={'menuwrap ' + className} ref={ref}>
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      <div className={'dropdown' + (open ? ' open' : '')} onClick={() => setOpen(false)}>{children}</div>
    </div>
  );
}

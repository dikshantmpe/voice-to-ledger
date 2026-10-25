'use client';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';

// Share sheet: WhatsApp, native share, copy text, CSV download.
export default function ShareReport({ open, onClose, title, text, csv, filename = 'voxledger-report.csv' }) {
  const { t, toast } = useApp();
  const canNative = typeof navigator !== 'undefined' && !!navigator.share;

  const whatsapp = () => { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); };

  const native = async () => {
    try {
      const file = csv ? new File([csv], filename, { type: 'text/csv' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ title, text, files: [file] });
      else await navigator.share({ title, text });
    } catch (e) { /* user closed the share sheet */ }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast(t('share_copied')); }
    catch (e) { toast('Copy failed'); }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{t('share_title')}</h3>
        <button className="btn sm soft" onClick={onClose}>{t('as_close')}</button>
      </div>
      <div className="sharegrid">
        <button onClick={whatsapp}><span className="sico">💬</span>{t('share_whatsapp')}</button>
        {canNative && <button onClick={native}><span className="sico">↗</span>{t('share_native')}</button>}
        <button onClick={copy}><span className="sico">⧉</span>{t('share_copy')}</button>
        {csv && <button onClick={download}><span className="sico">⭳</span>{t('share_csv')}</button>}
      </div>
      <div className="sharepre">{text}</div>
    </Modal>
  );
}

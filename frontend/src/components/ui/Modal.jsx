'use client';
// Re-uses the .modal / .sheet styles from app.css
export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">{children}</div>
    </div>
  );
}

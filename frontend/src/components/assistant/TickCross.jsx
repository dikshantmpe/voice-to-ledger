'use client';
// Two big buttons for users who cannot read/write: ✔ = yes / approve, ✘ = no / reject.
export default function TickCross({ onYes, onNo, yesLabel, noLabel }) {
  return (
    <div className="tc">
      <button className="tc-btn tc-yes" onClick={onYes} aria-label={yesLabel}>
        <span className="tc-ico">✔</span><span className="tc-txt">{yesLabel}</span>
      </button>
      <button className="tc-btn tc-no" onClick={onNo} aria-label={noLabel}>
        <span className="tc-ico">✘</span><span className="tc-txt">{noLabel}</span>
      </button>
    </div>
  );
}

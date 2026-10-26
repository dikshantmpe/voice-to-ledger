const FEATURES = [
  ['◉', 'Three languages', 'Speak or type in English, हिन्दी or ਪੰਜਾਬੀ. Mixed Hinglish works too.'],
  ['≣', 'Double entry, automatic', 'Every entry becomes a balanced debit and credit. Reversals keep the audit trail intact.'],
  ['◈', 'Party balances', 'See who owes you and whom you owe, with running totals for every customer and supplier.'],
  ['▦', 'Reports you can share', 'Trial balance, daily summary and CSV export, plus a one-tap WhatsApp share.'],
];

export default function Features() {
  return (
    <section className="sec" style={{ background: '#F3F7FD', paddingTop: '3.5rem' }}>
      <div className="lwrap center">
        <span className="eyebrow">Why VoxLedger</span>
        <h2 className="h2">Built for the <span>counter</span>, not the office</h2>
        <p className="intro">Everything a small shop needs, without the accounting jargon.</p>
        <div className="fgrid">
          {FEATURES.map(([ico, title, text]) => (
            <div className="fcard" key={title}>
              <div className="fico">{ico}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

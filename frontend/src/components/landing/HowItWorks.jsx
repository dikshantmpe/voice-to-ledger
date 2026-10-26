const WAVES = [[110, 0.2], [150, 0.4], [190, 0.7], [230, 0.35], [270, 0.18]];
const STEPS = [
  ['01', 'Speak or type', 'Say “kal 2 hazar kiraya diya”. Amounts like 3.5k, 2 hazar and 1.2 lakh are understood.'],
  ['02', 'Review the card', 'Each entry shows the party, amount, direction and debit and credit pair. Flags show what to check.'],
  ['03', 'Approve and post', 'Approved entries post to the ledger with a running cash balance and a full audit trail.'],
  ['04', 'Share the report', 'Export a trial balance or CSV, or send the day’s summary on WhatsApp in one tap.'],
];

export default function HowItWorks() {
  return (
    <section className="sec dark" id="how">
      <svg className="wv" viewBox="0 0 1440 320" preserveAspectRatio="none">
        {WAVES.map(([y, o]) => (
          <path key={y} fill="none" stroke="#5AA9FF" strokeOpacity={o} strokeWidth="2"
            d={`M0 ${y} C120 ${y - 70} 240 ${y + 70} 360 ${y} S600 ${y - 70} 720 ${y} S960 ${y + 70} 1080 ${y} S1320 ${y - 70} 1440 ${y}`} />
        ))}
      </svg>
      <div className="lwrap center">
        <span className="eyebrow" style={{ color: '#5AA9FF' }}>How it works</span>
        <h2 className="h2">Speak it. Check it. <span>Post it.</span></h2>
        <p className="intro">The same way your bahi-khata has always worked, with the writing done for you.</p>
        <div className="fgrid" style={{ marginTop: '2.6rem' }}>
          {STEPS.map(([n, title, text]) => (
            <div className="fcard" key={n} style={{ background: '#122A66', borderColor: '#1D3B7A' }}>
              <div className="fico" style={{ background: '#1E6FF1', color: '#fff' }}>{n}</div>
              <h3 style={{ color: '#fff' }}>{title}</h3>
              <p style={{ color: '#B9CCF2' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

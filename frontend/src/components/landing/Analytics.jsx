const PAIRS = [[55, 35], [80, 50], [45, 70], [90, 60], [65, 40], [75, 85], [50, 30]];

export default function Analytics() {
  return (
    <section className="sec" id="analytics">
      <div className="lwrap split">
        <div className="chart-wrap">
          <div className="legend"><span>Money in</span><span>Money out</span></div>
          <div className="chart">
            {PAIRS.map(([a, b], i) => (
              <div className="pair" key={i}><i style={{ height: a + '%' }} /><i style={{ height: b + '%' }} /></div>
            ))}
          </div>
        </div>
        <div>
          <span className="eyebrow">Voice analytics</span>
          <h2 className="h2">See the week <span>at a glance</span></h2>
          <p className="intro" style={{ marginLeft: 0 }}>Money in and money out for each day, built from approved entries only, so the numbers you see are the numbers you have checked.</p>
          <div className="chips" style={{ justifyContent: 'flex-start', marginTop: '1.4rem' }}>
            <span>Daily summary</span><span>Party-wise dues</span><span>Cash balance</span>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';
const BARS = 22;

// levels = Uint8Array from the AnalyserNode (or null when idle)
export default function Waveform({ levels, live }) {
  return (
    <div className={'wave' + (live && !levels ? ' live' : '')} id="wave">
      {Array.from({ length: BARS }, (_, i) => {
        const v = levels ? levels[i % levels.length] : 0;
        const h = levels ? Math.max(8, Math.round((v / 255) * 40)) : undefined;
        return <span key={i} style={levels ? { height: h, opacity: 1 } : undefined} />;
      })}
    </div>
  );
}

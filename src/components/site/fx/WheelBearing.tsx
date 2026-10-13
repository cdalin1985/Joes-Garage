/**
 * A ball-type wheel bearing that quietly spins — the illustration
 * for Joe's wheel-bearing tip. Pure SVG + CSS (classes in fx.css).
 */
export function WheelBearing({ className = "" }: { className?: string }) {
  const balls = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return { cx: 60 + Math.cos(a) * 36, cy: 60 + Math.sin(a) * 36 };
  });
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ball" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#c7ccd3" />
          <stop offset="100%" stopColor="#5b6169" />
        </radialGradient>
        <linearGradient id="race" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#e8ebef" />
          <stop offset="50%" stopColor="#8a9099" />
          <stop offset="100%" stopColor="#d5d9de" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="url(#race)" strokeWidth="9" />
      <g className="bearing-cage">
        <circle cx="60" cy="60" r="36" fill="none" stroke="#ffb02e" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="3 4" />
        {balls.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r="8.5" fill="url(#ball)" />
        ))}
      </g>
      <g className="bearing-inner">
        <circle cx="60" cy="60" r="22" fill="none" stroke="url(#race)" strokeWidth="7" />
        <circle cx="60" cy="60" r="12" fill="#0a0908" stroke="rgba(255,255,255,0.25)" />
        <rect x="58.5" y="40" width="3" height="6" rx="1" fill="#ffb02e" />
      </g>
    </svg>
  );
}

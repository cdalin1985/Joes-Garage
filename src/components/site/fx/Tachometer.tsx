"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "./gsap";

const SWEEP = 240; // degrees from 0 to 8,000 rpm
const angle = (rpm: number) => -SWEEP / 2 + (rpm / 8) * SWEEP;
const polar = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)] as const;
};
const arcPath = (from: number, to: number, r: number) => {
  const [x1, y1] = polar(angle(from), r);
  const [x2, y2] = polar(angle(to), r);
  const large = angle(to) - angle(from) > 180 ? 1 : 0;
  return `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
};

/**
 * A tachometer that blips the throttle when it scrolls into view, and again
 * whenever the pointer enters the nearest `[data-rev]` ancestor (the CTA).
 */
export function Tachometer({ className = "" }: { className?: string }) {
  const root = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const svg = root.current;
      if (!svg) return;
      const needle = svg.querySelector("[data-needle]");
      gsap.set(needle, { rotation: angle(0.9), svgOrigin: "100 100" });
      if (prefersReducedMotion()) return;

      const idle = gsap.to(needle, {
        rotation: `+=${1.8}`,
        duration: 0.09,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        paused: true,
      });
      const rev = (peak: number) =>
        gsap
          .timeline({ onStart: () => idle.pause(), onComplete: () => idle.play() })
          .to(needle, { rotation: angle(peak), duration: 0.45, ease: "power2.in" })
          .to(needle, { rotation: angle(0.9), duration: 1.3, ease: "elastic.out(1, 0.45)" });

      const st = ScrollTrigger.create({ trigger: svg, start: "top 80%", once: true, onEnter: () => rev(7.6) });
      const host = svg.closest("[data-rev]");
      const onEnter = () => rev(6.8);
      host?.addEventListener("pointerenter", onEnter);
      return () => {
        st.kill();
        host?.removeEventListener("pointerenter", onEnter);
      };
    },
    { scope: root },
  );

  const ticks = [];
  for (let i = 0; i <= 16; i++) {
    const rpm = i / 2;
    const major = i % 2 === 0;
    const [x1, y1] = polar(angle(rpm), 84);
    const [x2, y2] = polar(angle(rpm), major ? 70 : 76);
    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={rpm >= 6.5 ? "#ff3b2f" : "rgba(255,255,255,0.75)"}
        strokeWidth={major ? 2.5 : 1.2}
        strokeLinecap="round"
      />,
    );
    if (major) {
      const [lx, ly] = polar(angle(rpm), 58);
      ticks.push(
        <text key={`t${i}`} x={lx} y={ly + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.8)">
          {rpm}
        </text>,
      );
    }
  }

  return (
    <svg ref={root} viewBox="0 0 200 200" className={className} role="img" aria-label="Tachometer">
      <defs>
        <radialGradient id="tach-face" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#24201d" />
          <stop offset="100%" stopColor="#0b0a09" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#tach-face)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      <path d={arcPath(6.5, 8, 88)} fill="none" stroke="#ff3b2f" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      {ticks}
      <text x="100" y="140" textAnchor="middle" fontSize="8" letterSpacing="2" fill="rgba(255,255,255,0.45)">
        x1000 r/min
      </text>
      <g data-needle>
        <line x1="100" y1="112" x2="100" y2="26" stroke="#ff6a1a" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="100" y1="100" x2="100" y2="30" stroke="#ffd27a" strokeWidth="1" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="100" r="9" fill="#1a1715" stroke="#ff6a1a" strokeWidth="2" />
    </svg>
  );
}

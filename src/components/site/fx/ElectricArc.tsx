"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { prefersReducedMotion } from "./gsap";

/**
 * Crackling electricity at the spark plug's electrode tip.
 *
 * Drawn in the logo's own coordinate space (viewBox 0 0 433 1602) so it sits
 * exactly on the artwork at any size. Idles as small crackles; `surge()`
 * throws long branching bolts for a moment.
 */

export type ArcHandle = { surge: (ms?: number) => void };

/** Electrode tip in logo units (measured from the traced artwork). */
const TIP = { x: 247, y: 1535 };
const BOLTS = 4;

type Pt = [number, number];

/** Midpoint-displacement lightning between two points. */
function bolt(a: Pt, b: Pt, spread: number, depth: number): Pt[] {
  if (depth === 0) return [a, b];
  const mx = (a[0] + b[0]) / 2 + (Math.random() - 0.5) * spread;
  const my = (a[1] + b[1]) / 2 + (Math.random() - 0.5) * spread;
  const m: Pt = [mx, my];
  return [...bolt(a, m, spread / 2, depth - 1).slice(0, -1), ...bolt(m, b, spread / 2, depth - 1)];
}

const toAttr = (pts: Pt[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

export const ElectricArc = forwardRef<ArcHandle, { className?: string }>(function ElectricArc(
  { className = "" },
  ref,
) {
  const glowRefs = useRef<(SVGPolylineElement | null)[]>([]);
  const coreRefs = useRef<(SVGPolylineElement | null)[]>([]);
  const surgeUntil = useRef(0);

  useImperativeHandle(ref, () => ({
    surge: (ms = 900) => {
      surgeUntil.current = performance.now() + ms;
    },
  }));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    let last = 0;
    let visible = true;
    const svg = glowRefs.current[0]?.ownerSVGElement;
    const io = svg
      ? new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
        })
      : null;
    if (svg && io) io.observe(svg);

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden || t - last < 55) return;
      if (document.documentElement.classList.contains("fx-3d-ready")) return; // 3D plug has the stage
      last = t;
      const surging = t < surgeUntil.current;
      for (let i = 0; i < BOLTS; i++) {
        const glow = glowRefs.current[i];
        const core = coreRefs.current[i];
        if (!glow || !core) continue;
        // Idle: two short crackles, sometimes none. Surge: every bolt, long.
        const on = surging || (i < 2 && Math.random() > 0.25);
        if (!on) {
          glow.setAttribute("points", "");
          core.setAttribute("points", "");
          continue;
        }
        const angle = surging
          ? Math.PI * (0.05 + Math.random() * 0.9) // anywhere below the tip
          : Math.random() * Math.PI * 2;
        const len = surging ? 140 + Math.random() * 300 : 16 + Math.random() * 34;
        const end: Pt = [TIP.x + Math.cos(angle) * len, TIP.y + Math.sin(angle) * len];
        const pts = toAttr(bolt([TIP.x, TIP.y], end, surging ? len * 0.45 : 22, surging ? 6 : 4));
        glow.setAttribute("points", pts);
        core.setAttribute("points", pts);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, []);

  return (
    <svg className={`plug-arc ${className}`} viewBox="0 0 433 1602" aria-hidden="true">
      {Array.from({ length: BOLTS }, (_, i) => (
        <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline
            ref={(el) => {
              glowRefs.current[i] = el;
            }}
            stroke="#7fdcff"
            strokeOpacity="0.45"
            strokeWidth="9"
          />
          <polyline
            ref={(el) => {
              coreRefs.current[i] = el;
            }}
            stroke="#ffffff"
            strokeWidth="2.6"
          />
        </g>
      ))}
    </svg>
  );
});

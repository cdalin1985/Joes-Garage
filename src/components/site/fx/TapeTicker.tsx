"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "./gsap";

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" className="h-[0.8em] w-[0.8em] shrink-0" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Two strips of caution tape crossing the page, each an endless ticker of
 * services. Scrolling throws them faster; scrolling up runs them backward.
 */
export function TapeTicker({ items }: { items: string[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tracks = gsap.utils.toArray<HTMLElement>(".tape-track", root.current);
      const loops = tracks.map((t, i) =>
        gsap.fromTo(
          t,
          { xPercent: i % 2 ? -50 : 0 },
          { xPercent: i % 2 ? 0 : -50, duration: 38 + i * 6, ease: "none", repeat: -1 },
        ),
      );
      // Park far from zero so the loops can run backward without hitting the start.
      loops.forEach((l) => l.totalTime(l.duration() * 500));
      let dir = 1;
      const st = ScrollTrigger.create({
        onUpdate(self) {
          if (self.direction !== dir) dir = self.direction;
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 7);
          loops.forEach((l) => {
            gsap.to(l, { timeScale: dir * boost, duration: 0.15, overwrite: true });
            gsap.to(l, { timeScale: dir, duration: 1.2, delay: 0.15, ease: "power2.out" });
          });
        },
      });
      return () => st.kill();
    },
    { scope: root },
  );

  const run = (
    <>
      {items.map((s) => (
        <span key={s} className="tape-item">
          {s}
          <Bolt />
        </span>
      ))}
    </>
  );

  return (
    <div ref={root} className="relative z-10 -my-6 overflow-hidden py-10" aria-label="Services">
      <div className="tape -rotate-[2.5deg] bg-[#d40f17] py-3 text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)]">
        <div className="tape-track mega text-3xl sm:text-4xl">
          {run}
          <span aria-hidden="true" className="contents">
            {run}
          </span>
        </div>
      </div>
      <div className="tape absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 rotate-[2deg] bg-[#151210] py-3 text-white/70">
        <div className="tape-track mega text-2xl sm:text-3xl" aria-hidden="true">
          {run}
          {run}
        </div>
      </div>
    </div>
  );
}

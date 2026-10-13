"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "./gsap";

/**
 * Reveals every `[data-reveal]` inside it as it scrolls into view — rising out
 * of a blur, in reading order. `[data-scramble]` text decodes itself too.
 * Content is in the HTML regardless; this only choreographs its entrance.
 */
export function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", el);
      if (prefersReducedMotion()) {
        gsap.set(items, { opacity: 1 });
        return;
      }
      const batch = ScrollTrigger.batch(items, {
        start: "top 96%",
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { opacity: 0, y: 42, filter: "blur(10px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "expo.out", stagger: 0.1, clearProps: "filter" },
          ),
      });
      const scrambles = gsap.utils.toArray<HTMLElement>("[data-scramble]", el).map((s) =>
        ScrollTrigger.create({
          trigger: s,
          start: "top 92%",
          once: true,
          onEnter: () =>
            gsap.to(s, {
              duration: 1,
              ease: "none",
              scrambleText: { text: s.textContent ?? "", chars: "upperCase", speed: 0.6 },
            }),
        }),
      );
      return () => {
        batch.forEach((t) => t.kill());
        scrambles.forEach((t) => t.kill());
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}

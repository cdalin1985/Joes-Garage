"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "./gsap";

/**
 * Grid of `.spot-card` children that light up under the cursor, tilt in 3D,
 * and deal themselves onto the table as they scroll into view.
 */
export function SpotlightGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const cards = gsap.utils.toArray<HTMLElement>(".spot-card", el);
      if (prefersReducedMotion()) {
        gsap.set(cards, { opacity: 1 });
        return;
      }

      gsap.set(cards, { opacity: 0, y: 70, rotateX: -28, transformPerspective: 900 });
      const batch = ScrollTrigger.batch(cards, {
        start: "top 96%",
        once: true,
        onEnter: (els) =>
          gsap.to(els, {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1,
            ease: "expo.out",
            stagger: 0.09,
            overwrite: true,
            clearProps: "opacity",
          }),
      });

      const fine = matchMedia("(pointer: fine)").matches;
      const move = (e: PointerEvent) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>(".spot-card");
        if (!card) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        if (fine) {
          gsap.to(card, {
            rotateY: (px - 0.5) * 12,
            rotateX: -(py - 0.5) * 10,
            transformPerspective: 900,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      };
      const out = (e: PointerEvent) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>(".spot-card");
        if (card && !card.contains(e.relatedTarget as Node)) {
          gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" });
        }
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerout", out);
      return () => {
        batch.forEach((t) => t.kill());
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerout", out);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className={`spot-grid ${className}`}>
      {children}
    </div>
  );
}

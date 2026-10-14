"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "./gsap";

/** Callouts on the photo, as % of its width/height (measured on the image). */
const SPOTS = [
  { x: 52, y: 8, text: "Hub & wheel studs", side: "left" },
  { x: 33, y: 29, text: "Rotor — measured, not guessed", side: "right" },
  { x: 11, y: 74, text: "On stands, every time", side: "right" },
] as const;

const SRC = "/brand/bay-rotor.webp";

/**
 * The shop's own photo, revealed like a roll-up door, then "developed" from a
 * red duotone into full color by a scan beam, with callouts popping in.
 * Motion-reduced visitors (and no-JS) just see the color photo and callouts.
 */
export function BayPhoto({ alt }: { alt: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      gsap.set(q("[data-slats]"), { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(q("[data-duo]"), { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(q("[data-beam]"), { top: "0%", opacity: 0 });
      gsap.set(q("[data-spot]"), { scale: 0, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        defaults: { ease: "power3.out" },
      });
      // The roll-up door's bottom edge rises, then the beam develops the photo.
      tl.to(q("[data-slats]"), { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "power2.inOut" })
        .to(q("[data-beam]"), { opacity: 1, duration: 0.15 }, 0.95)
        .to(q("[data-beam]"), { top: "100%", duration: 1.4, ease: "power1.inOut" }, 0.95)
        .to(q("[data-duo]"), { clipPath: "inset(100% 0% 0% 0%)", duration: 1.4, ease: "power1.inOut" }, 0.95)
        .to(q("[data-beam]"), { opacity: 0, duration: 0.2 }, 2.3)
        .to(q("[data-spot]"), { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2.4)", stagger: 0.18 }, 1.3);

      // Scaled up enough that the drift never shows an edge.
      gsap.fromTo(q("[data-parallax]"), { yPercent: 4, scale: 1.12 }, {
        yPercent: -4,
        scale: 1.12,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative mx-auto w-full max-w-[26rem]">
      <div className="absolute -inset-6 rounded-[2rem] bg-[#e3121b]/20 blur-3xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-black shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
        <div data-parallax className="relative">
          <Image src={SRC} alt={alt} width={417} height={526} unoptimized className="block h-auto w-full" />
          {/* Red duotone copy on top, wiped away by the beam */}
          <div data-duo className="absolute inset-0" aria-hidden="true" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
            <Image src={SRC} alt="" width={417} height={526} unoptimized className="block h-auto w-full grayscale contrast-125" />
            <div className="absolute inset-0 bg-[#e3121b] mix-blend-multiply" />
            <div className="absolute inset-0 bg-[#0a0908]/30" />
          </div>
        </div>
        <div className="grain pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          data-beam
          className="pointer-events-none absolute inset-x-0 h-[3px] -translate-y-1/2 bg-[#7fdcff] opacity-0 shadow-[0_0_24px_6px_rgba(127,220,255,0.65)]"
          aria-hidden="true"
        />
        <div
          data-slats
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{ background: "repeating-linear-gradient(180deg, #2a2724 0 22px, #1a1816 22px 26px)" }}
          aria-hidden="true"
        />
        {SPOTS.map((s) => (
          <div key={s.text} data-spot className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-[#ff3b3f]">
              <span className="spot-ping absolute inset-0 rounded-full bg-[#ff3b3f]" />
            </span>
            <span
              className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/15 bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur ${
                s.side === "left" ? "right-4" : "left-4"
              }`}
            >
              {s.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "./gsap";
import { SparkPlug } from "./SparkPlug";
import { ElectricArc, type ArcHandle } from "./ElectricArc";

type Step = { n: string; title: string; body: string };

/** Where each band of the plug sits for each step (yPercent / rotate). */
const POSES = [
  { top: [-6, -4], mid: [0, 0], bottom: [5, 3], scan: 0 }, // 01 — opened up, listening
  { top: [-13, -9], mid: [1, 0], bottom: [12, 7], scan: 1 }, // 02 — fully apart, under the scanner
  { top: [0, 0], mid: [0, 0], bottom: [0, 0], scan: 0 }, //    03 — back together, firing
];

/**
 * "How it works", told by Joe's spark plug: it comes apart into an exploded
 * view as you read through the steps, gets scanned, then reassembles and
 * fires on the last one. The plug sticks beside the steps on wide screens.
 */
export function ExplodedSteps({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLDivElement>(null);
  const arc = useRef<ArcHandle>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const q = gsap.utils.selector(el);
      const parts = {
        top: q('[data-part="top"]'),
        mid: q('[data-part="mid"]'),
        bottom: q('[data-part="bottom"]'),
      };
      const blocks = q("[data-step]");
      const scan = q("[data-scan]");

      const pose = (i: number) => {
        const p = POSES[i];
        (["top", "mid", "bottom"] as const).forEach((k) =>
          gsap.to(parts[k], {
            yPercent: p[k][0],
            rotate: p[k][1],
            duration: 1.1,
            ease: i === 2 ? "back.out(2.2)" : "expo.out",
            overwrite: "auto",
          }),
        );
        gsap.to(scan, { opacity: p.scan, duration: 0.4 });
        blocks.forEach((b, j) => b.classList.toggle("is-active", j === i));
        if (i === 2) gsap.delayedCall(0.45, () => arc.current?.surge(1200));
      };

      const triggers = blocks.map((b, i) =>
        ScrollTrigger.create({
          trigger: b,
          start: "top 62%",
          end: "bottom 38%",
          onToggle: (self) => self.isActive && pose(i),
        }),
      );

      gsap.fromTo(
        q("[data-fuse]"),
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: q("ol")[0], start: "top 60%", end: "bottom 50%", scrub: true } },
      );

      return () => triggers.forEach((t) => t.kill());
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mt-14 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <div className="flex items-center justify-center lg:sticky lg:top-20 lg:h-[calc(100svh-6rem)]">
        <SparkPlug exploded scan glow={false} className="h-[42svh] [filter:drop-shadow(0_0_14px_rgba(255,150,60,0.45))_drop-shadow(0_0_40px_rgba(127,220,255,0.15))] lg:h-[74svh]">
          <span className="plug-tip" aria-hidden="true" />
          <ElectricArc ref={arc} />
        </SparkPlug>
      </div>

      <ol className="relative">
        <span className="absolute bottom-0 left-[1.15rem] top-0 w-px bg-white/10" aria-hidden="true" />
        <span
          data-fuse
          className="absolute bottom-0 left-[1.15rem] top-0 w-px origin-top bg-gradient-to-b from-[#ffb02e] to-[#ff6a1a] shadow-[0_0_12px_2px_rgba(255,140,40,0.6)]"
          aria-hidden="true"
        />
        {steps.map((s) => (
          <li
            key={s.n}
            data-step
            className="step-block group relative flex items-center py-10 pl-14 lg:min-h-[62svh] lg:py-0"
          >
            <span className="absolute left-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0a0908] text-xs font-bold text-white/70 transition-colors duration-500 group-[.is-active]:border-[#ffb02e] group-[.is-active]:text-[#ffb02e] group-[.is-active]:shadow-[0_0_18px_rgba(255,176,46,0.6)]">
              {s.n}
            </span>
            <div>
              <p className="mega text-[clamp(4rem,9vw,7.5rem)] text-white/[0.06]" aria-hidden="true">
                {s.n}
              </p>
              <h3 className="-mt-8 font-display text-2xl font-bold text-white sm:text-3xl">{s.title}</h3>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-white/60">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

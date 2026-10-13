"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, prefersReducedMotion, whenDoorOpen } from "./gsap";
import { SparkPlug } from "./SparkPlug";
import { ElectricArc, type ArcHandle } from "./ElectricArc";
import { EmberCanvas, type EmberHandle } from "./EmberCanvas";

/**
 * The home-page hero: Joe's spark plug drops in, hits, and fires.
 *
 * The text column arrives as server-rendered `children` (so it's in the HTML
 * for search engines); this component only choreographs it. Hooks it reads:
 *   [data-split]      — headline lines, split into letters that flip up
 *   [data-scramble]   — eyebrow text that decodes itself
 *   [data-fx="in"]    — anything else that fades up in sequence
 */
export function HeroIgnition({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const arc = useRef<ArcHandle>(null);
  const embers = useRef<EmberHandle>(null);

  const { contextSafe } = useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      document.documentElement.classList.add("fx-ready");
      const fadeIns = gsap.utils.toArray<HTMLElement>('[data-fx="in"]', el);

      if (prefersReducedMotion()) {
        gsap.set(fadeIns, { opacity: 1 });
        return;
      }

      const q = gsap.utils.selector(el);
      const tipCenter = () => {
        const r = el.querySelector(".plug-tip")?.getBoundingClientRect();
        return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
      };
      const fire = (power: number, ms: number) => {
        arc.current?.surge(ms);
        const t = tipCenter();
        if (t) embers.current?.burst(t.x, t.y, power);
      };

      const splits = q("[data-split]").map((line) =>
        SplitText.create(line, { type: "chars", charsClass: "chr" }),
      );
      const chars = splits.flatMap((s) => s.chars);
      const scramble = q("[data-scramble]")[0];
      const heads = fadeIns.filter((n) => n.matches("h1") || n === scramble);
      const rest = fadeIns.filter((n) => !heads.includes(n));

      const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      tl.set(heads, { opacity: 1 })
        .from(chars, { yPercent: 120, rotateX: -90, opacity: 0, duration: 0.9, stagger: 0.022 }, 0.15)
        .fromTo(
          q("[data-plug-stage]"),
          { y: () => -window.innerHeight * 1.1, rotate: -38, opacity: 0 },
          { y: 0, rotate: 0, opacity: 1, duration: 0.7, ease: "power3.in" },
          0.1,
        )
        .add(() => {
          fire(1.5, 1100);
          gsap.fromTo(q(".hero-flash"), { opacity: 0.85 }, { opacity: 0, duration: 0.9, ease: "power2.out" });
        })
        .fromTo(
          q("[data-plug-stage]"),
          { scaleY: 0.9, scaleX: 1.06 },
          { scaleY: 1, scaleX: 1, duration: 0.9, ease: "elastic.out(1, 0.35)" },
          "<",
        )
        .fromTo(rest, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, "<0.05");
      if (scramble) {
        tl.to(
          scramble,
          {
            duration: 1.1,
            scrambleText: { text: scramble.textContent ?? "", chars: "⚡#01JOESGARAGE", speed: 0.5 },
            ease: "none",
          },
          0,
        );
      }
      const stopWaiting = whenDoorOpen(() => tl.play());

      // Idle: the plug floats, and every few seconds it fires on its own.
      gsap.to(q("[data-plug-float]"), { y: -16, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
      let idle: gsap.core.Tween;
      const schedule = () => {
        idle = gsap.delayedCall(3.5 + Math.random() * 3.5, () => {
          fire(0.35, 320);
          schedule();
        });
      };
      schedule();

      // Pointer parallax on the plug.
      const tilt = q("[data-plug-tilt]")[0];
      const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.8, ease: "power3" });
      const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.8, ease: "power3" });
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 30);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 16);
      };
      el.addEventListener("pointermove", onMove);

      // Scroll away: the plug climbs and turns, the copy drifts and fades.
      const out = { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 } as const;
      gsap.to(q("[data-plug-scroll]"), { yPercent: -22, rotate: 16, ease: "none", scrollTrigger: out });
      gsap.to(q("[data-hero-text]"), { yPercent: 18, opacity: 0.15, ease: "none", scrollTrigger: { ...out } });

      return () => {
        stopWaiting();
        idle?.kill();
        el.removeEventListener("pointermove", onMove);
        splits.forEach((s) => s.revert());
      };
    },
    { scope: root },
  );

  /** Clicking (or pressing Enter on) the plug fires it. */
  const onPlugDown = contextSafe(() => {
    if (prefersReducedMotion()) return;
    arc.current?.surge(900);
    const r = root.current?.querySelector(".plug-tip")?.getBoundingClientRect();
    if (r) embers.current?.burst(r.left + r.width / 2, r.top + r.height / 2, 1.2);
    gsap.fromTo(
      root.current!.querySelector("[data-plug-float]"),
      { scale: 0.94 },
      { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.3)" },
    );
  });

  return (
    <section ref={root} className="ign-hero relative isolate overflow-hidden text-white">
      <div className="ign-floor" aria-hidden="true" />
      <EmberCanvas ref={embers} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="hero-flash" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-4 px-5 pb-20 pt-8 lg:grid-cols-[1.3fr_0.7fr] lg:gap-8 lg:pb-14 lg:pt-2">
        <div data-hero-text className="order-2 lg:order-1">
          {children}
        </div>

        <div data-plug-scroll className="order-1 flex justify-center lg:order-2">
          <div data-plug-stage className="h-[30svh] sm:h-[44svh] lg:h-[76svh]">
            <div data-plug-tilt className="h-full [perspective:900px] [transform-style:preserve-3d]">
              <div data-plug-float className="h-full">
                <button
                  type="button"
                  onClick={onPlugDown}
                  aria-label="Fire the spark plug"
                  className="block h-full cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
                >
                  <SparkPlug className="h-full rotate-[-14deg]">
                    <span className="plug-tip" aria-hidden="true" />
                    <ElectricArc ref={arc} />
                  </SparkPlug>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-6 hidden flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 sm:flex"
        aria-hidden="true"
      >
        Scroll
        <span className="scroll-cue" />
      </div>
    </section>
  );
}

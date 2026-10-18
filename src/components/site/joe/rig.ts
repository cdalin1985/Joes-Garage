"use client";

import { gsap, prefersReducedMotion } from "@/components/site/fx/gsap";
import { CLICK_MOVES, MOVES, REST, type MoveName } from "./moves";
import type { PoseName } from "./art";

export type Rig = ReturnType<typeof createRig>;
type Options = { rest?: PoseName; clickMoves?: MoveName[]; followers?: HTMLElement[] };

/**
 * Puppeteer for one photo Joe: `stage` holds one <img> per pose (data-pose).
 * Moves cross-fade to their pose and move the stage as a whole.
 */
export function createRig(stage: HTMLElement, { rest = "base", clickMoves = CLICK_MOVES, followers = [] }: Options = {}) {
  const reduce = prefersReducedMotion();
  const imgs = [...stage.querySelectorAll<HTMLElement>("[data-pose]")];
  const warn = stage.querySelector<HTMLElement>("[data-warn]")!;
  // Elements painted onto Joe (the sign's text) move with him.
  const body = [stage, ...followers];
  gsap.set(stage, { transformOrigin: "50% 100%", ...REST });
  gsap.set(followers, REST);

  let current: gsap.core.Timeline | null = null;
  let hold: gsap.core.Tween | null = null;
  let visible = true;
  const timers: (gsap.core.Tween | gsap.core.Timeline)[] = [];
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(stage);

  const show = (tl: gsap.core.Timeline, pose: PoseName, at: number) =>
    imgs.forEach((img) => tl.to(img, { opacity: img.dataset.pose === pose ? 1 : 0, duration: 0.12, ease: "none" }, at));

  const play = (name: MoveName, dur = 2.5) => {
    current?.kill();
    hold?.kill();
    const move = MOVES[name] as (typeof MOVES)[MoveName] & { pose?: PoseName };
    const tl = gsap.timeline({ onComplete: () => void (current === tl && (current = null)) });
    tl.to(body, { ...REST, duration: 0.15, ease: "power2.out" }, 0);
    tl.set(warn, { opacity: 0 }, 0);
    show(tl, move.pose ?? rest, 0);
    const out = move.run(tl, body, dur, { warn });
    show(tl, rest, out);
    tl.to(body, { ...REST, duration: 0.3, ease: "power2.inOut" }, out);
    current = tl;
    if (reduce) {
      tl.pause("pose");
      hold = gsap.delayedCall(Math.min(dur, 2), () => void tl.progress(1));
    }
    return tl;
  };

  const stop = () => {
    current?.kill();
    hold?.kill();
    current = null;
    const tl = gsap.timeline();
    show(tl, rest, 0);
    tl.to(body, { ...REST, duration: 0.3, ease: "power2.out" }, 0);
    gsap.set(warn, { opacity: 0 });
  };

  const playRandomClick = () => play(clickMoves[Math.floor(Math.random() * clickMoves.length)], 1.4);

  const every = (min: number, max: number, fn: () => void) => {
    const next = () => timers.push(gsap.delayedCall(gsap.utils.random(min, max), () => (fn(), next())));
    next();
  };

  const startIdle = ({ fidgets = ["tap"] as MoveName[] } = {}) => {
    if (reduce) return;
    const img = imgs.find((i) => i.dataset.pose === rest);
    if (img) timers.push(gsap.to(img, { scaleY: 1.008, transformOrigin: "50% 100%", duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    every(6, 10, () => {
      if (!current && visible && fidgets.length) play(fidgets[Math.floor(Math.random() * fidgets.length)]);
    });
  };

  // Joe leans a touch toward the cursor (replaces eye-tracking on the cartoon).
  const leans = body.map((el) => gsap.quickTo(el, "skewX", { duration: 0.6, ease: "power3" }));
  const onMove = (e: PointerEvent) => {
    if (reduce || !visible || current) return;
    const r = stage.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
    const v = gsap.utils.clamp(-2, 2, -dx * 4);
    leans.forEach((lean) => lean(v));
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const hover = (on: boolean) => {
    if (current || reduce) return;
    gsap.to(body, { scale: on ? 1.03 : 1, duration: 0.25, ease: "back.out(2)" });
  };

  const destroy = () => {
    current?.kill();
    hold?.kill();
    timers.forEach((t) => t.kill());
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
  };

  return { play, stop, playRandomClick, startIdle, hover, destroy, reduce };
}

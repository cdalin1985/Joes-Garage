"use client";

import { gsap } from "@/components/site/fx/gsap";
import { ANCHOR_X, POSES, type Behavior, type PoseName } from "./art";
import { JOE_SPARK_EVENT } from "./events";
import { DUR, EASE, ORIGIN, REST } from "./motion";
import { MOVES, type Fx, type Move, type MoveName } from "./moves";
import { drop } from "./quips";

export type Rig = ReturnType<typeof createRig>;
type Prop = "wrench" | "warn";
type Options = {
  rest: PoseName;
  behavior: Behavior;
  /** Click order (empty when a click does something else, or nothing). */
  clicks: MoveName[];
  lean: 1 | -1;
  /** Builds each prop the first time a move needs it. */
  props: Record<Prop, () => HTMLElement>;
  /** A click started a move (for its line). */
  onClick?: (name: MoveName, tl: gsap.core.Timeline) => void;
};
type TL = gsap.core.Timeline;

const SPARKS = "[data-testid=joe-sparks]";

/**
 * Puppeteer for one photo Joe. JoeSlot renders the layers: the box, a floor
 * (contact shadow), the stage (moves and hover) and the idle layer (sway),
 * which holds the pose photos. Poses are fetched only when asked for, and
 * cut in on top of each other so he never goes see-through.
 */
export function createRig(box: HTMLElement, { rest, behavior, clicks, lean, props, onClick }: Options) {
  const stage = box.querySelector<HTMLElement>("[data-joe-stage]")!;
  const idle = box.querySelector<HTMLElement>("[data-joe-idle]")!;
  const floor = box.querySelector<HTMLElement>("[data-joe-floor]");
  const still = box.querySelector<HTMLElement>("[data-joe-still]");
  gsap.set([stage, idle], { transformOrigin: ORIGIN, willChange: "transform" });

  // ── Pose layers, made on demand ───────────────────────────────────────
  const layers = new Map<PoseName, HTMLElement>();
  const loads = new Map<PoseName, Promise<boolean>>();
  const made: HTMLElement[] = [];
  if (still) (layers.set(rest, still), loads.set(rest, Promise.resolve(true)));
  let shown: PoseName = rest;
  let z = 1;
  let dead = false;

  const load = (pose: PoseName) => {
    let p = loads.get(pose);
    if (p) return p;
    const img = Object.assign(new Image(), { alt: "", draggable: false, decoding: "async", fetchPriority: "low" } as const);
    img.dataset.pose = pose;
    img.className = "joe-art absolute inset-0 h-full w-full select-none";
    gsap.set(img, { opacity: 0, xPercent: ANCHOR_X[pose] ?? 0 });
    idle.insertBefore(img, [...idle.children].find((c) => !(c as HTMLElement).dataset.pose) ?? null);
    made.push(img);
    img.src = POSES[pose];
    p = img.decode().then(
      () => {
        if (dead) return false;
        layers.set(pose, img);
        // The peek has no still: his rest pose shows as soon as it's ready.
        if (pose === shown) gsap.set(img, { opacity: 1, zIndex: z });
        return true;
      },
      () => false,
    );
    loads.set(pose, p);
    return p;
  };

  const timeouts = new Set<number>();
  /** Create and decode these poses; false if they aren't all ready within `ms`. */
  const need = (poses: PoseName[], ms?: number): Promise<boolean> => {
    const all = Promise.all(poses.map(load)).then((ok) => ok.every(Boolean));
    if (ms === undefined) return all;
    const late = new Promise<boolean>((r) => {
      const id = window.setTimeout(() => (timeouts.delete(id), r(false)), ms);
      timeouts.add(id);
    });
    return Promise.race([all, late]);
  };

  const prop: Partial<Record<Prop, HTMLElement>> = {};
  const use = (name: Prop) => (prop[name] ??= idle.appendChild(props[name]()));

  /** Cut to `pose` at `at`: the new photo fades in on top, then the old one drops out underneath, so Joe never goes see-through. */
  const cut = (tl: TL, pose: PoseName, at: number) => {
    const next = layers.get(pose);
    const prev = layers.get(shown);
    if (!next || next === prev) return; // not decoded yet: the move plays motion-only
    tl.set(next, { zIndex: ++z }, at).to(next, { opacity: 1, duration: DUR.snap, ease: EASE.inOut }, at);
    if (prev) tl.set(prev, { opacity: 0 }, at + DUR.snap);
    shown = pose; // tracked as the timeline is built
  };

  // ── Ground sync: the shadow tightens and fades as Joe lifts, spreads a touch as he dips ──
  const sx = floor && gsap.quickSetter(floor, "scaleX");
  const op = floor && gsap.quickSetter(floor, "opacity");
  const syncGround = () => {
    if (!sx || !op) return;
    const y = gsap.getProperty(stage, "yPercent") as number;
    sx(gsap.utils.clamp(0.9, 1.06, 1 + y * 0.04));
    op(1 + Math.min(0, y) * 0.15);
  };

  // ── Idle sway (residents): a slow weight shift, paused whenever it isn't seen ──
  let current: TL | null = null;
  let hoverTw: gsap.core.Tween | null = null;
  let hidden = false;
  let ratio = 0;
  const swayTw =
    behavior === "peek"
      ? null
      : gsap.to(idle, { rotation: 0.3, duration: DUR.slow * 4, ease: EASE.inOut, yoyo: true, repeat: -1, delay: gsap.utils.random(0, 1.4) });
  const sway = () => void swayTw?.paused(hidden || !ratio || !!current);

  const io = new IntersectionObserver(([e]) => ((ratio = e.intersectionRatio), sway()), { threshold: [0, 0.5, 1] });
  io.observe(box);

  /** Stop whatever is playing and leave exactly one photo showing, on top of the others. */
  const normalise = () => {
    current?.kill();
    current = null;
    hoverTw?.kill();
    const imgs = [...layers.values()];
    gsap.killTweensOf(imgs);
    const top = imgs.filter((i) => (gsap.getProperty(i, "opacity") as number) > 0.5).sort((a, b) => +b.style.zIndex - +a.style.zIndex)[0];
    imgs.forEach((i) => gsap.set(i, { opacity: i === top ? 1 : 0, zIndex: i === top ? 1 : 0 }));
    z = 1;
    shown = (top?.dataset.pose as PoseName | undefined) ?? rest;
    Object.values(prop).forEach((el) => (gsap.killTweensOf(el), gsap.set(el, { opacity: 0 })));
    idle.querySelectorAll(SPARKS).forEach((s) => s.remove());
  };

  /** Back to rest from `at`: a dip with the cut to rest at its bottom when he's in another pose, then the settle. */
  const release = (tl: TL, at: number, settle: number = DUR.base) => {
    if (shown !== rest && layers.has(rest)) {
      tl.to(stage, { yPercent: 0.4, duration: DUR.snap, ease: EASE.in }, at);
      cut(tl, rest, (at += DUR.snap));
    }
    tl.to(stage, { ...REST, duration: settle, ease: EASE.inOut }, at);
  };

  const timeline = () => {
    const tl: TL = gsap.timeline({ onUpdate: syncGround, onComplete: () => void (current === tl && ((current = null), sway())) });
    return (current = tl);
  };

  const fx = (tl: TL): Fx => ({
    cut: (pose, at) => cut(tl, pose, at),
    wrench: () => use("wrench"),
    warn: () => use("warn"),
    height: box.offsetHeight,
    lean,
    spark: behavior === "hero" ? () => void window.dispatchEvent(new Event(JOE_SPARK_EVENT)) : undefined,
  });

  // Bumped by every play and stop, so a `perform` still waiting for its poses gives way.
  let seq = 0;

  const play = (name: MoveName, { dur }: { dur?: number } = {}) => {
    if (hidden || dead) return null;
    seq++;
    normalise();
    const move: Move = MOVES[name];
    const tl = timeline();
    // Interrupted mid-move: square up on the first beat.
    if (gsap.getProperty(stage, "rotation") || gsap.getProperty(stage, "xPercent"))
      tl.to(stage, { rotation: 0, xPercent: 0, duration: DUR.snap, ease: EASE.inOut }, 0);
    // A pose-free move started from another pose cuts back to rest on its first beat.
    if (!move.poses.length) cut(tl, rest, DUR.snap);
    const end = move.run(tl, stage, dur ?? move.dur ?? 2.5, fx(tl));
    if (tl.labels.pose === undefined) tl.addLabel("pose", DUR.snap);
    if (move.prop) tl.set(use(move.prop), { opacity: 0 }, end);
    release(tl, end, name === "present" ? DUR.slow : DUR.base);
    sway();
    return tl;
  };

  /**
   * Fetch the move's poses (up to `wait` ms), then play it; a late pose plays
   * motion-only. `onStart` gets the timeline (a GSAP timeline is a thenable,
   * so it can't be what the promise resolves to).
   */
  const perform = async (name: MoveName, { dur, wait = 300, onStart }: { dur?: number; wait?: number; onStart?: (tl: TL) => void } = {}) => {
    const mine = ++seq;
    await need(MOVES[name].poses, wait);
    const tl = mine === seq ? play(name, { dur }) : null;
    if (tl) onStart?.(tl);
  };

  /** Cut back to rest at a dip and settle, from wherever the move is. */
  const stop = () => {
    seq++;
    if (!current || dead) return;
    normalise();
    release(timeline(), 0);
  };

  // ── Clicks, in a fixed order so the next one's poses can be fetched ahead ──
  let turn = 0;
  const prefetch = () => {
    const name = clicks[turn % clicks.length];
    if (!name) return;
    const move: Move = MOVES[name];
    need(move.poses);
    if (move.prop === "wrench") use("wrench");
  };
  const click = () => {
    const name = clicks[turn % clicks.length];
    // Ignore early re-clicks: let the gesture land first.
    if (!name || (current && current.progress() < 0.6)) return;
    perform(name, {
      onStart: (tl) => {
        turn++;
        onClick?.(name, tl);
        prefetch();
      },
    });
  };

  const hover = (on: boolean) => {
    if (on) prefetch();
    if (current || hidden || dead) return;
    hoverTw?.kill();
    hoverTw = gsap.to(stage, {
      yPercent: on ? -0.6 : 0,
      duration: on ? DUR.quick : DUR.base,
      ease: on ? EASE.out : EASE.inOut,
      onUpdate: syncGround,
    });
  };

  const setHidden = (on: boolean) => {
    hidden = on;
    if (on) {
      seq++;
      normalise();
      drop(box, true);
      const r = layers.get(rest);
      if (r) (layers.forEach((i) => gsap.set(i, { opacity: i === r ? 1 : 0 })), (shown = rest));
      gsap.set(stage, REST);
      syncGround();
    }
    sway();
  };

  const destroy = () => {
    dead = true;
    seq++;
    current?.kill();
    hoverTw?.kill();
    swayTw?.kill();
    io.disconnect();
    timeouts.forEach(clearTimeout);
    drop(box, true);
    [...made, ...Object.values(prop), ...idle.querySelectorAll(SPARKS)].forEach((el) => el.remove());
    gsap.set([box, stage, idle, floor, still].filter(Boolean), { clearProps: "all" });
  };

  return {
    need,
    play,
    perform,
    stop,
    click,
    hover,
    /** Share of him on screen, as of the last time it crossed 0, 0.5 or 1. */
    ratio: () => ratio,
    busy: () => current !== null,
    setHidden,
    destroy,
  };
}

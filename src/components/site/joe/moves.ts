import type { SoundKind } from "@/components/site/fx/noise-synth";
import type { PoseName } from "./art";

type TL = gsap.core.Timeline;
/** Moves the whole of Joe (`el`); returns when to head back to rest. */
type Motion = (tl: TL, el: gsap.TweenTarget, dur: number, fx: { warn: HTMLElement }) => number;
type Move = { pose?: PoseName; run: Motion };

const odd = (n: number) => Math.max(1, Math.round(n) | 1);
const shake = (tl: TL, el: gsap.TweenTarget, vars: gsap.TweenVars, step: number, dur: number, at = 0.15) =>
  tl.to(el, { ...vars, duration: step, ease: "sine.inOut", yoyo: true, repeat: odd((dur - at - 0.3) / step) }, at);

export const REST = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };

export const MOVES = {
  wave: {
    pose: "wave",
    run: (tl, el) => {
      tl.fromTo(el, { y: 0 }, { y: -10, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1 }, 0);
      tl.addLabel("pose", 0.2);
      shake(tl, el, { rotation: 2.5 }, 0.2, 1.6, 0.2);
      return 1.6;
    },
  },
  tap: {
    run: (tl, el) => {
      tl.addLabel("pose", 0.1);
      tl.to(el, { scaleY: 0.985, scaleX: 1.01, duration: 0.12, ease: "power1.inOut", yoyo: true, repeat: 3 }, 0);
      return 0.5;
    },
  },
  thumbsUp: {
    pose: "thumb",
    run: (tl, el, dur) => {
      tl.to(el, { y: -16, scaleY: 1.03, duration: 0.2, ease: "power2.out" }, 0);
      tl.addLabel("pose", 0.2);
      tl.to(el, { y: 0, scaleY: 1, duration: 0.5, ease: "bounce.out" }, 0.2);
      return Math.max(1.3, dur - 0.3);
    },
  },
  point: {
    pose: "point",
    run: (tl, el, dur) => {
      tl.to(el, { rotation: 2, x: 6, duration: 0.3, ease: "back.out(2)" }, 0);
      tl.addLabel("pose", 0.3);
      shake(tl, el, { x: 12 }, 0.35, dur, 0.3);
      return dur;
    },
  },
  coverEars: {
    pose: "ears",
    run: (tl, el, dur) => {
      tl.to(el, { scaleY: 0.97, duration: 0.15 }, 0);
      tl.addLabel("pose", 0.15);
      shake(tl, el, { rotation: 1.6 }, 0.07, dur);
      return dur - 0.3;
    },
  },
  wince: {
    pose: "wince",
    run: (tl, el, dur) => {
      tl.to(el, { rotation: -3, x: -6, duration: 0.15, ease: "power2.out" }, 0);
      tl.addLabel("pose", 0.15);
      shake(tl, el, { x: -2 }, 0.05, dur);
      return dur - 0.3;
    },
  },
  listen: {
    pose: "listen",
    run: (tl, el, dur) => {
      tl.to(el, { rotation: -2, duration: 0.4, ease: "sine.out" }, 0);
      tl.addLabel("pose", 0.4);
      shake(tl, el, { rotation: 1 }, 0.7, dur, 0.4);
      return dur - 0.3;
    },
  },
  tapAlong: {
    run: (tl, el, dur) => {
      tl.addLabel("pose", 0.1);
      const n = odd((dur - 0.4) / 0.13);
      tl.to(el, { y: -5, scaleY: 1.01, duration: 0.13, ease: "power2.out", yoyo: true, repeat: n }, 0.1);
      tl.to(el, { rotation: 1.5, duration: 0.26, ease: "sine.inOut", yoyo: true, repeat: odd((dur - 0.4) / 0.26) }, 0.1);
      return 0.1 + (n + 1) * 0.13;
    },
  },
  jolt: {
    pose: "wince",
    run: (tl, el) => {
      tl.addLabel("pose", 0.17);
      [0.1, 0.75, 1.15, 1.9].forEach((at, i) => {
        tl.to(el, { y: -24, rotation: i % 2 ? 3 : -3, duration: 0.08, ease: "power2.out" }, at);
        tl.to(el, { y: 0, rotation: 0, duration: 0.42, ease: "bounce.out" }, at + 0.08);
      });
      return 2.4;
    },
  },
  shrug: {
    pose: "shrug",
    run: (tl, el, dur) => {
      tl.to(el, { y: -6, duration: 0.3, ease: "back.out(2)" }, 0);
      tl.addLabel("pose", 0.3);
      tl.to(el, { y: 0, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 1 }, 1);
      return dur - 0.3;
    },
  },
  waveSteam: {
    pose: "wave",
    run: (tl, el, dur) => {
      tl.to(el, { rotation: -2, duration: 0.2 }, 0);
      tl.addLabel("pose", 0.2);
      shake(tl, el, { rotation: 2.5, x: 4 }, 0.14, dur, 0.2);
      return dur - 0.3;
    },
  },
  pointLight: {
    pose: "point",
    run: (tl, el, dur, { warn }) => {
      tl.fromTo(warn, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.5)" }, 0);
      tl.addLabel("pose", 0.35);
      tl.to(warn, { scale: 1.15, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: odd((dur - 0.7) / 0.25) }, 0.35);
      tl.to(warn, { opacity: 0, scale: 0.3, duration: 0.25 }, dur - 0.3);
      return dur - 0.3;
    },
  },
  think: {
    pose: "listen",
    run: (tl, el, dur) => {
      tl.to(el, { rotation: -1.5, duration: 0.35 }, 0);
      tl.addLabel("pose", 0.35);
      shake(tl, el, { rotation: 1, y: -2 }, 0.8, dur, 0.35);
      return dur - 0.3;
    },
  },
  nod: {
    run: (tl, el) => {
      tl.to(el, { y: 4, scaleY: 0.985, duration: 0.14, ease: "sine.inOut", yoyo: true, repeat: 3 }, 0);
      tl.addLabel("pose", 0.14);
      return 0.6;
    },
  },
  propShow: {
    run: (tl, el) => {
      tl.to(el, { y: -18, scaleY: 1.03, duration: 0.2, ease: "power2.out" }, 0);
      tl.addLabel("pose", 0.2);
      tl.to(el, { y: 0, scaleY: 1, duration: 0.5, ease: "bounce.out" }, 0.2);
      shake(tl, el, { rotation: 2 }, 0.16, 1.4, 0.4);
      return 1.3;
    },
  },
} satisfies Record<string, Move>;

export type MoveName = keyof typeof MOVES;

export const CLICK_MOVES: MoveName[] = ["thumbsUp", "wave", "point"];
export const PROP_CLICKS: MoveName[] = ["propShow"];

/** Which reaction Joe plays for each example sound in "What's that noise?". */
export const SOUND_MOVES: Record<SoundKind, MoveName> = {
  squeal: "coverEars",
  belt: "coverEars",
  grind: "wince",
  hum: "listen",
  clicks: "tapAlong",
  clunk: "jolt",
  "rapid-click": "shrug",
  hiss: "waveSteam",
  none: "pointLight",
};

/** Every pose a behaviour might need, so it can be preloaded once. */
export const posesFor = (moves: MoveName[]) => [...new Set(moves.map((m) => (MOVES[m] as Move).pose).filter(Boolean))] as PoseName[];

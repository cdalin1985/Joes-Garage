import type { SoundKind } from "@/components/site/fx/noise-synth";
import type { PoseName } from "./art";
import { DUR, EASE } from "./motion";

type TL = gsap.core.Timeline;
/** What a move can reach besides Joe's stage. */
export type Fx = {
  /** Cut to a pose at a time on the move's timeline (skipped if it isn't decoded yet). */
  cut: (pose: PoseName, at: number) => void;
  wrench: () => HTMLElement;
  warn: () => HTMLElement;
  /** Box height in px, for props that travel a share of Joe's height. */
  height: number;
  /** +1 when the page content is to Joe's right, -1 when it's to his left. */
  lean: 1 | -1;
  /** Fire the hero's spark plug. */
  spark?: () => void;
};
/**
 * A move tweens the stage (`el`) in yPercent / xPercent / rotation, using the
 * motion tokens only, and returns when the rig should release him to rest.
 * `dur` is the hold the caller asked for (default `dur`, else 2.5 s).
 */
export type Move = { poses: PoseName[]; prop?: "wrench" | "warn"; dur?: number; run: (tl: TL, el: HTMLElement, dur: number, fx: Fx) => number };

/** The opening beat: dip, cut at the bottom, then rise to `y` (yPercent). Adds the "pose" label at the cut. */
const beat = (tl: TL, el: HTMLElement, fx: Fx, pose: PoseName, y = 0) => {
  tl.to(el, { yPercent: 0.4, duration: DUR.snap, ease: EASE.in }, 0);
  fx.cut(pose, DUR.snap);
  tl.addLabel("pose", DUR.snap);
  tl.to(el, { yPercent: y, duration: y < 0 ? DUR.quick : DUR.base, ease: EASE.out }, DUR.snap);
};

/** A short dip at `at` (a nod, a jolt, a catch): down on the snap, back up over `up`. */
const dip = (tl: TL, el: HTMLElement, at: number, depth = 0.4, up: number = DUR.quick) =>
  tl
    .to(el, { yPercent: depth, duration: DUR.snap, ease: EASE.in }, at)
    .to(el, { yPercent: 0, duration: up, ease: EASE.out }, at + DUR.snap);

export const MOVES = {
  capTip: {
    poses: ["cap"],
    run: (tl, el, _dur, fx) => {
      beat(tl, el, fx, "cap", 0.6);
      tl.to(el, { rotation: -0.6, duration: DUR.quick, ease: EASE.out }, DUR.snap);
      tl.to(el, { yPercent: 0, rotation: 0, duration: DUR.base, ease: EASE.inOut }, 0.75);
      return 1.2;
    },
  },
  thumbsUp: {
    poses: ["thumb"],
    run: (tl, el, _dur, fx) => {
      beat(tl, el, fx, "thumb", -1.2);
      tl.to(el, { yPercent: 0, duration: DUR.base, ease: EASE.inOut }, 0.45);
      return 1.3;
    },
  },
  point: {
    poses: ["point"],
    dur: 1.6,
    run: (tl, el, dur, fx) => {
      beat(tl, el, fx, "point");
      tl.to(el, { rotation: 1, xPercent: 1.5, duration: DUR.quick, ease: EASE.out }, DUR.snap);
      return dur;
    },
  },
  // The hero's version: he points, the plug fires on his cue, he takes it in.
  pointSpark: {
    poses: ["point"],
    run: (tl, el, _dur, fx) => {
      beat(tl, el, fx, "point");
      tl.to(el, { rotation: 1, xPercent: 1.5, duration: DUR.quick, ease: EASE.out }, DUR.snap);
      tl.addLabel("hit", 0.6).call(() => fx.spark?.(), [], "hit");
      tl.to(el, { rotation: -0.4, xPercent: -0.5, duration: DUR.snap, ease: EASE.out }, 0.66);
      tl.to(el, { rotation: 1, xPercent: 1.5, duration: DUR.base, ease: EASE.inOut }, 0.75);
      return 2.2;
    },
  },
  wrenchSpin: {
    poses: ["toss"],
    prop: "wrench",
    run: (tl, el, _dur, fx) => {
      const w = fx.wrench();
      beat(tl, el, fx, "toss");
      // A real throw: it slows to the top of its arc and falls back, spinning at a steady rate into the catch.
      tl.set(w, { opacity: 1, y: 0, rotation: 0 }, 0.08)
        .to(w, { rotation: 540, duration: DUR.base * 2, ease: EASE.linear }, 0.08)
        .to(w, { y: -0.3 * fx.height, duration: DUR.base, ease: EASE.up }, 0.08)
        .to(w, { y: 0, duration: DUR.base, ease: EASE.in }, 0.5)
        .set(w, { opacity: 0 }, 0.95)
        .addLabel("hit", 0.92);
      dip(tl, el, 0.92, 0.6, DUR.base);
      return 1.45;
    },
  },
  coverEars: {
    poses: ["ears"],
    run: (tl, el, dur, fx) => {
      beat(tl, el, fx, "ears", 0.6);
      tl.to(el, { rotation: -0.8, duration: DUR.quick, ease: EASE.out }, DUR.snap);
      return dur;
    },
  },
  wince: {
    poses: ["wince"],
    run: (tl, el, dur, fx) => {
      beat(tl, el, fx, "wince");
      tl.to(el, { rotation: -1.2, xPercent: -1, duration: DUR.quick, ease: EASE.out }, DUR.snap);
      return dur;
    },
  },
  // He leans in further as the hum grows.
  listen: {
    poses: ["listen"],
    run: (tl, el, dur, fx) => {
      beat(tl, el, fx, "listen");
      tl.to(el, { rotation: -1, duration: DUR.base, ease: EASE.out }, DUR.snap);
      // Only if the hold outlasts it, so it never overlaps the release.
      if (dur >= 1.3 + DUR.slow) tl.to(el, { rotation: -1.4, duration: DUR.slow, ease: EASE.inOut }, 1.3);
      return dur;
    },
  },
  // A nod on every 4th synth click (they're 0.13 s apart).
  groove: {
    poses: [],
    run: (tl, el) => {
      for (let i = 0; i < 4; i++) dip(tl, el, 0.05 + 0.52 * i);
      return 2.2;
    },
  },
  // Hits land on the synth's clunks; the cut hides in the first one.
  jolt: {
    poses: ["wince"],
    run: (tl, el, _dur, fx) => {
      [0.1, 0.75, 1.15, 1.9].forEach((at) => dip(tl, el, at, 1));
      fx.cut("wince", 0.19);
      tl.addLabel("pose", 0.19);
      return 2.4;
    },
  },
  shrug: {
    poses: ["shrug"],
    run: (tl, el, dur, fx) => {
      beat(tl, el, fx, "shrug", -0.6);
      tl.to(el, { yPercent: 0, duration: DUR.base, ease: EASE.inOut }, 1.1);
      return dur;
    },
  },
  // Fanning the steam away.
  steam: {
    poses: ["wave"],
    run: (tl, el, dur, fx) => {
      beat(tl, el, fx, "wave");
      [0.8, -0.8, 0].forEach((r, i) => tl.to(el, { rotation: r, duration: DUR.slow, ease: EASE.inOut }, DUR.snap + DUR.slow * i));
      return dur;
    },
  },
  // The light flickers like a real dash light: no pulse.
  checkLight: {
    poses: ["point"],
    prop: "warn",
    run: (tl, el, dur, fx) => {
      const light = fx.warn();
      beat(tl, el, fx, "point");
      tl.to(el, { rotation: 1, duration: DUR.quick, ease: EASE.out }, DUR.snap);
      tl.fromTo(light, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: DUR.base, ease: EASE.out }, 0.12);
      [0.35, 1, 0.35, 1].forEach((opacity, i) => tl.to(light, { opacity, duration: DUR.quick, ease: EASE.inOut }, 0.6 + DUR.quick * i));
      tl.to(light, { opacity: 0, duration: DUR.quick, ease: EASE.in }, dur - 0.3);
      return dur;
    },
  },
  think: {
    poses: ["listen"],
    run: (tl, el, dur, fx) => {
      beat(tl, el, fx, "listen");
      tl.to(el, { rotation: -0.6, duration: DUR.slow, ease: EASE.inOut }, DUR.snap);
      return dur;
    },
  },
  nod: {
    poses: [],
    run: (tl, el) => {
      dip(tl, el, 0);
      dip(tl, el, 0.32);
      return 0.7;
    },
  },
  // A weight shift while the sign flips (after the rig's square-up beat, if a flip interrupted one).
  shift: {
    poses: [],
    run: (tl, el, _dur, fx) => {
      tl.to(el, { rotation: 0.6 * fx.lean, duration: DUR.quick, ease: EASE.out }, DUR.snap);
      tl.to(el, { rotation: 0, duration: DUR.base, ease: EASE.inOut }, DUR.snap + DUR.quick);
      return 0.73;
    },
  },
  // He lifts what he's holding a touch toward the page and holds it there.
  present: {
    poses: [],
    dur: 1.2,
    run: (tl, el, dur, fx) => {
      tl.to(el, { yPercent: 0.4, duration: DUR.snap, ease: EASE.in }, 0);
      tl.to(el, { yPercent: -1, rotation: 0.8 * fx.lean, duration: DUR.quick, ease: EASE.out }, DUR.snap);
      return 0.31 + dur;
    },
  },
  wave: {
    poses: ["wave"],
    run: (tl, el, _dur, fx) => {
      beat(tl, el, fx, "wave");
      tl.to(el, { rotation: 0.8, duration: DUR.quick, ease: EASE.out }, DUR.snap);
      [-0.4, 0.8, 0].forEach((r, i) => tl.to(el, { rotation: r, duration: DUR.base, ease: EASE.inOut }, DUR.base * (i + 1)));
      return 1.9;
    },
  },
  // Booking: thumbs up, a four-step jig, a dead stop on a cap tip (chat.ts adds sparks off the brim at 1.81).
  celebrate: {
    poses: ["thumb", "jigA", "jigB", "cap"],
    run: (tl, el, _dur, fx) => {
      beat(tl, el, fx, "thumb", -1.2);
      for (let i = 0; i < 4; i++) {
        const s = 0.42 + 0.32 * i;
        tl.to(el, { yPercent: 0, duration: DUR.snap, ease: EASE.in }, s);
        fx.cut(i % 2 ? "jigB" : "jigA", s + DUR.snap);
        tl.to(el, { yPercent: -0.8, rotation: i % 2 ? 0.6 : -0.6, duration: DUR.quick, ease: EASE.out }, s + DUR.snap);
      }
      tl.addLabel("hit", 1.7).to(el, { yPercent: 0.4, rotation: 0, duration: DUR.snap, ease: EASE.in }, "hit");
      fx.cut("cap", 1.79);
      tl.to(el, { yPercent: 0, duration: DUR.base, ease: EASE.out }, 1.79);
      return 3.8;
    },
  },
} satisfies Record<string, Move>;

export type MoveName = keyof typeof MOVES;

/** Click order for Joes holding his wrench (fixed, so the next pose can be fetched ahead). */
export const CLICKS = ["capTip", "thumbsUp", "point", "wrenchSpin"] satisfies MoveName[];
export const HERO_CLICKS = ["capTip", "thumbsUp", "pointSpark", "wrenchSpin"] satisfies MoveName[];

/** Which reaction Joe plays for each example sound in "What's that noise?". */
export const SOUND_MOVES: Record<SoundKind, MoveName> = {
  squeal: "coverEars",
  belt: "coverEars",
  grind: "wince",
  hum: "listen",
  clicks: "groove",
  clunk: "jolt",
  "rapid-click": "shrug",
  hiss: "steam",
  none: "checkLight",
};

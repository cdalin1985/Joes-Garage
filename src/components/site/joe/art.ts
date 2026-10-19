/** Joe's poses: photo cut-outs in /public/joe, all on the same canvas so they line up. */
export const POSES = {
  base: "/joe/joe.webp",
  wave: "/joe/joe-wave.webp",
  thumb: "/joe/joe-thumb.webp",
  point: "/joe/joe-point.webp",
  ears: "/joe/joe-ears.webp",
  listen: "/joe/joe-listen.webp",
  shrug: "/joe/joe-shrug.webp",
  wince: "/joe/joe-wince.webp",
  cap: "/joe/joe-cap.webp",
  toss: "/joe/joe-toss.webp",
  jigA: "/joe/joe-jig-a.webp",
  jigB: "/joe/joe-jig-b.webp",
  rotor: "/joe/joe-rotor.webp",
  oilCan: "/joe/joe-oil-can.webp",
  battery: "/joe/joe-battery.webp",
  tire: "/joe/joe-tire.webp",
  sign: "/joe/joe-sign.webp",
} as const;

export type PoseName = keyof typeof POSES;
/** Poses a Joe can rest in (the still image shown before/without animation). */
export type JoeArtName = Extract<PoseName, "base" | "rotor" | "oilCan" | "battery" | "tire" | "sign">;

/** Loose wrench Joe tosses and catches in the toss pose. */
export const WRENCH = "/joe/joe-wrench.webp";
/** The dash-style check-engine light he points at. */
export const WARN = "/joe/joe-check-engine.svg";

export const JOE_W = 560;
export const JOE_H = 916;

/** Sideways nudge (xPercent of the image) that keeps each pose's boots where joe.webp's are (measured from the alpha masks). */
export const ANCHOR_X: Partial<Record<PoseName, number>> = { wince: -7, point: -5, cap: 3.5, listen: 3 };

export type Behavior = "hero" | "noise" | "service" | "hours" | "peek";

/** Where Joe's caption bubble sits: beside his head, or just above his cap. */
export type QuipSide = "right" | "left" | "top";

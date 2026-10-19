"use client";

import { gsap } from "@/components/site/fx/gsap";
import type { QuipSide } from "./art";
import { chatOpen, joeHidden } from "./cast";
import { DUR, EASE } from "./motion";

/** Joe's lines: dry, kind, shop-floor. Each one shows at most once per visit. */
export const QUIPS = {
  "hero-hello": "Hi. I’m the Joe in Joe’s.",
  "click-cap": "Much obliged.",
  "click-thumb": "Good tap. Firm pedal feel.",
  "click-spark": "The plug’s the show-off. I do the work.",
  "click-catch": "Torqued to spec.",
  "plug-3": "It does that.",
  "peek-services": "If it rolls, squeaks or blinks, start here.",
  "peek-noise": "Go on, do the noise. Everybody does.",
  "peek-inspection": "Don’t take my word for it. That’s the point.",
  "peek-text-joe": "No jargon needed. “It goes clunk” works.",
  "noise-squeal": "Brakes are polite. They squeal first.",
  "noise-grind": "Oof. That’s a “bring it in” noise.",
  "noise-hum": "Nice pitch. Wrong instrument.",
  "noise-clicks": "Catchy. Not in a good way.",
  "noise-clunk": "Felt that one in my boots.",
  "noise-rapid-click": "The official sound of twenty below.",
  "noise-belt": "Somewhere, a dog just sat up.",
  "noise-hiss": "Steam belongs in a sauna. Not under a hood.",
  "noise-none": "It’s not a mood light.",
  "svc-rotor": "Brought a rotor. Flowers seemed like a lot.",
  "svc-oilCan": "Brought snacks. For your engine.",
  "svc-battery": "Positive attitude. Negative terminal.",
  "svc-tire": "I’d make a tire joke, but they’re worn out.",
  "svc-base": "Right tool, right job. Usually this one.",
  "hours-flips": "Careful. You’ll wear it out.",
  "chat-open": "Ask away. No question’s too small.",
  "chat-booked": "Request’s in. That’s the whole dance.",
} as const;
export type QuipId = keyof typeof QUIPS;
/** auto: Joe volunteers it (strict budget); prompted: the visitor did something; exempt: the booking line. */
export type QuipKind = "auto" | "prompted" | "exempt";

// ── Budget: per visit in sessionStorage, per page view in memory ─────────
const KEY = "joes-quips";
type Tally = { n: number; auto: number; said: string[]; plug: number; noise: number; svc: number };
const fresh = (): Tally => ({ n: 0, auto: 0, said: [], plug: 0, noise: 0, svc: 0 });
/** The last tally, for when storage is blocked: the budget then holds for this page. */
let mem = fresh();
const tally = (): Tally => {
  try {
    return (mem = { ...fresh(), ...JSON.parse(sessionStorage.getItem(KEY) ?? "{}") });
  } catch {
    return mem;
  }
};
const save = (t: Tally) => {
  mem = t;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    /* storage unavailable */
  }
};

/** Add one to a per-visit counter (plug clicks, sounds played, service pages) and return the new count. */
export const count = (key: "plug" | "noise" | "svc") => {
  const t = tally();
  t[key]++;
  save(t);
  return t[key];
};

let page = { path: "", auto: 0 };
const thisPage = () => (page.path === location.pathname ? page : (page = { path: location.pathname, auto: 0 }));

const born = new WeakMap<Element, number>();
/** Note when a Joe went live: he volunteers nothing in his first 2.5 s. */
export const markBorn = (box: Element) => void born.set(box, performance.now());

// ── Bubble ───────────────────────────────────────────────────────────────
/** One bubble on screen, site-wide. */
let shown: { el: HTMLElement; host: HTMLElement; tl: gsap.core.Timeline } | null = null;
let lastEnd = -Infinity;
export const showing = () => shown !== null;

const BUBBLE =
  "pointer-events-none absolute z-10 block w-max max-w-[12.5rem] select-none rounded-2xl text-left border border-white/[0.12] bg-[#14110e] px-3 py-2 font-sans text-[13px] font-semibold leading-[1.35] tracking-[0.005em] text-[#f4f4f2] opacity-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_36px_-14px_rgba(0,0,0,0.9)] [text-wrap:balance] sm:max-w-[15rem] sm:px-3.5 sm:py-2.5 sm:text-sm";
/** Per side: placement classes (the corner nearest his mouth is squared off, like the chat's bubbles) and the grow origin. */
const SIDES: Record<QuipSide, [string, string]> = {
  right: ["left-[62%] bottom-[86%] rounded-bl-md", "0% 100%"],
  left: ["right-[62%] bottom-[86%] rounded-br-md", "100% 100%"],
  top: ["left-1/2 bottom-[95.5%]", "50% 100%"],
};

const INTERACTIVE =
  'a[href],button,input,select,textarea,summary,label,[role="button"],[role="link"],[contenteditable="true"],[tabindex]:not([tabindex="-1"])';

/** True when the rect is on screen and no link, button or field sits under it (24 px grid, at most 80 samples). */
export function clearOf(r: DOMRect | { left: number; top: number; right: number; bottom: number }, own?: Element | null) {
  if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return false;
  const w = r.right - r.left;
  const h = r.bottom - r.top;
  const cols = Math.min(10, Math.max(2, Math.ceil(w / 24)));
  const rows = Math.min(8, Math.max(2, Math.ceil(h / 24)));
  for (let i = 0; i < cols * rows; i++) {
    const x = r.left + (w * ((i % cols) + 0.5)) / cols;
    const y = r.top + (h * (Math.floor(i / cols) + 0.5)) / rows;
    const hit = document.elementFromPoint(x, y)?.closest(INTERACTIVE);
    if (hit && !own?.contains(hit)) return false;
  }
  return true;
}

/** Try the bubble on one side: nudge it inside the window, then check it's under the header, above the fold and off every control. */
const fits = (el: HTMLElement, side: QuipSide, host: HTMLElement) => {
  const [cls, origin] = SIDES[side];
  el.className = `${BUBBLE} ${cls}`;
  gsap.set(el, { x: 0, xPercent: side === "top" ? -50 : 0, transformOrigin: origin });
  const r = el.getBoundingClientRect();
  const dx = Math.max(0, 12 - r.left) + Math.min(0, innerWidth - 12 - r.right);
  gsap.set(el, { x: dx });
  return r.top >= 72 && r.bottom <= innerHeight - 8 && clearOf({ left: r.left + dx, top: r.top, right: r.right + dx, bottom: r.bottom }, host);
};

const typing = () => {
  const a = document.activeElement as HTMLElement | null;
  return !!a && (a.isContentEditable || a.matches("input, textarea"));
};

/** Fade out the bubble on screen (only if it's `host`'s, when given); `now` removes it at once. */
export function drop(host?: HTMLElement, now = false) {
  if (!shown || (host && shown.host !== host)) return;
  const { el, tl } = shown;
  shown = null;
  lastEnd = performance.now();
  tl.kill();
  if (now) el.remove();
  else gsap.to(el, { opacity: 0, y: -4, duration: DUR.quick, ease: EASE.in, onComplete: () => el.remove() });
}

/**
 * Joe says `id` in a caption bubble beside `host`, on the first of `sides`
 * that's clear, `delay` s from now (placed and checked now, so callers can
 * size their holds). Returns the time until it's gone (s), or 0 if it was
 * skipped: a skipped line isn't marked said and costs no budget.
 */
export function say(host: HTMLElement, id: QuipId, sides: QuipSide[], kind: QuipKind, delay = 0): number {
  const t = tally();
  const html = document.documentElement.classList;
  if (t.said.includes(id) || joeHidden() || html.contains("fx-intro") || document.visibilityState !== "visible") return 0;
  if (chatOpen() && innerWidth < 640) return 0;
  if (kind !== "exempt" && t.n >= 6) return 0;
  const now = performance.now();
  if (kind === "auto" && (shown || t.auto >= 3 || thisPage().auto >= 2 || now - lastEnd < 12_000 || now - (born.get(host) ?? 0) < 2500 || typing()))
    return 0;

  const el = document.createElement("span");
  el.setAttribute("data-joe-quip", "");
  el.dataset.testid = "joe-quip";
  el.setAttribute("aria-hidden", "true");
  el.textContent = QUIPS[id];
  host.append(el);
  if (!sides.some((side) => fits(el, side, host))) return el.remove(), 0;

  // A prompted line takes over from a bubble that's showing: old one out, then this one in.
  const wait = delay + (shown ? DUR.quick : 0);
  drop();
  const hold = gsap.utils.clamp(1.8, 3.6, 1.2 + 0.05 * QUIPS[id].length);
  const tl = gsap
    .timeline({ delay: wait, onComplete: () => (el.remove(), shown?.el === el && ((shown = null), (lastEnd = performance.now()))) })
    .fromTo(el, { opacity: 0, y: 6, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: DUR.base, ease: EASE.out })
    .to(el, { opacity: 0, y: -4, duration: DUR.quick, ease: EASE.in }, DUR.base + hold);
  shown = { el, host, tl };

  t.said.push(id);
  if (kind !== "exempt") t.n++;
  if (kind === "auto") (t.auto++, thisPage().auto++);
  save(t);
  return wait + DUR.base + hold + DUR.quick;
}

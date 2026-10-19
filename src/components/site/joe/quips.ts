"use client";

import { gsap } from "@/components/site/fx/gsap";
import type { PoseName, QuipSide } from "./art";
import { chatOpen, joeHidden } from "./cast";
import { DUR, EASE } from "./motion";

/**
 * Joe's lines: dry, kind, shop-floor. Each one shows at most once per visit.
 * A "\n" breaks a two-sentence line at its full stop; U+00A0 and U+2060 keep a phrase on one line.
 */
export const QUIPS = {
  "hero-hello": "Hi. I’m the Joe in Joe’s.",
  "click-cap": "Much obliged.",
  "click-thumb": "Two thumbs seemed like showing off.",
  "click-spark": "The plug’s the show-⁠off.\nI do the work.",
  "click-catch": "Torqued to spec.",
  "plug-3": "It does that.",
  "peek-services": "If it rolls, squeaks or blinks, start here.",
  "peek-noise": "Pick yours. Saves doing the noise at the counter.",
  "peek-inspection": "Don’t take my word for it.\nThat’s the point.",
  "peek-text-joe": "No jargon needed.\n“It goes clunk” works.",
  "noise-squeal": "Brakes are polite.\nThey squeal first.",
  "noise-grind": "Oof.\nThat’s a “bring it in” noise.",
  "noise-hum": "Nice pitch.\nWrong instrument.",
  "noise-clicks": "Catchy.\nNot in a good way.",
  "noise-clunk": "Felt that one in my boots.",
  "noise-rapid-click": "Twenty below’s anthem.\nDon’t wait on it.",
  "noise-belt": "Somewhere, a dog just sat up.",
  "noise-hiss": "Steam belongs in a sauna.\nNot under a hood.",
  "noise-none": "It’s not a mood light.",
  "svc-rotor": "Brought a rotor.\nFlowers seemed like a lot.",
  "svc-oilCan": "Brought snacks.\nFor your engine.",
  "svc-battery": "Positive attitude.\nNegative terminal.",
  "svc-tire": "Four of these hold the whole car up. No pressure.",
  "svc-base": "Right tool for the job.\nI checked twice.",
  "hours-flips": "Careful.\nYou’ll wear it out.",
  "chat-open": "Ask away.\nNo question’s too small.",
  "chat-booked": "Request’s in.\nPardon the happy dance.",
  "chat-booked-plain": "Request’s in.\nGood call.",
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
/** Time since this Joe went live (ms). */
export const age = (box: Element) => performance.now() - (born.get(box) ?? 0);

// ── Guard ────────────────────────────────────────────────────────────────
const INTERACTIVE =
  'a[href],button,input,select,textarea,summary,label,[role="button"],[role="link"],[contenteditable="true"],[tabindex]:not([tabindex="-1"])';

/** The text node with a glyph at (x, y), if any. The caret APIs snap to the nearest text, so check the characters either side. */
const textAt = (x: number, y: number) => {
  const p = document.caretPositionFromPoint?.(x, y);
  const r = p ? null : document.caretRangeFromPoint?.(x, y);
  const n = p ? p.offsetNode : r?.startContainer;
  const o = p ? p.offset : (r?.startOffset ?? 0);
  if (n?.nodeType !== Node.TEXT_NODE || !n.nodeValue?.trim()) return null;
  const range = document.createRange();
  range.setStart(n, Math.max(0, o - 1));
  range.setEnd(n, Math.min(n.nodeValue.length, o + 1));
  return [...range.getClientRects()].some((b) => b.width && x >= b.left - 1 && x <= b.right + 1 && y >= b.top && y <= b.bottom) ? n : null;
};

/**
 * True when the rect is on screen and no link, button, field or line of text
 * sits under it or within 6 px of it (`step` px grid, edges included).
 */
export function clearOf(r: { left: number; top: number; right: number; bottom: number }, own?: Element | null, step = 12) {
  if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return false;
  const left = Math.max(0, r.left - 6);
  const top = Math.max(0, r.top - 6);
  const w = Math.min(innerWidth - 1, r.right + 6) - left;
  const h = Math.min(innerHeight - 1, r.bottom + 6) - top;
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);
  for (let i = 0; i <= cols; i++)
    for (let j = 0; j <= rows; j++) {
      const x = left + (w * i) / cols;
      const y = top + (h * j) / rows;
      const hit = document.elementFromPoint(x, y)?.closest(INTERACTIVE) ?? textAt(x, y);
      if (hit && !own?.contains(hit)) return false;
    }
  return true;
}

// ── Bubble ───────────────────────────────────────────────────────────────
/** One bubble on screen, site-wide. */
let shown: { el: HTMLElement; host: HTMLElement; tl: gsap.core.Timeline } | null = null;
let lastEnd = -Infinity;
export const showing = () => shown !== null;

/**
 * His head and any hand raised beside it, cap to chin, per pose: [left, right] in % of the box, ANCHOR_X
 * applied (measured from the alpha masks, like ANCHOR_X). Side bubbles sit just outside it; every other
 * pose is about [42, 58]. Kept here, not in art.ts, so it loads with the bubbles and not on every page.
 */
const HEAD: Partial<Record<PoseName, [number, number]>> = {
  wave: [17, 58],
  point: [35, 57],
  ears: [30, 69],
  listen: [36, 60],
  wince: [22, 39],
  cap: [33, 58],
};
/** Grow origin per side (fx.css places each side and squares off the corner nearest his mouth). */
const ORIGIN: Record<QuipSide, string> = { right: "0% 100%", left: "100% 100%", top: "50% 100%" };

/** The pose on top in `host` right now. */
const poseIn = (host: HTMLElement) =>
  [...host.querySelectorAll<HTMLElement>("[data-pose]")]
    .filter((i) => (gsap.getProperty(i, "opacity") as number) > 0.5)
    .sort((a, b) => +b.style.zIndex - +a.style.zIndex)[0]?.dataset.pose as PoseName | undefined;

/** Shrink-wrap the bubble to its longest line, so a wrapped line leaves no empty block on the right. */
const shrink = (el: HTMLElement) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const lines = [...range.getClientRects()];
  const left = Math.min(...lines.map((b) => b.left));
  el.style.width = `${Math.ceil(2 * (left - el.getBoundingClientRect().left) + Math.max(...lines.map((b) => b.right)) - left + 1)}px`;
};

/**
 * Try the bubble on one side, beside the head of the pose he's in: nudge it inside the window, then check
 * it's under the header, above the fold, off his face and off every control and line of text.
 */
const fits = (el: HTMLElement, side: QuipSide, host: HTMLElement, [lo, hi]: [number, number]) => {
  el.setAttribute("data-joe-quip", side);
  const box = host.getBoundingClientRect();
  const x = side === "top" ? 0 : ((side === "left" ? lo - 42 : hi - 58) * box.width) / 100;
  gsap.set(el, { x, xPercent: side === "top" ? -50 : 0, transformOrigin: ORIGIN[side] });
  const r = el.getBoundingClientRect();
  const dx = Math.max(0, 12 - r.left) + Math.min(0, innerWidth - 12 - r.right);
  gsap.set(el, { x: x + dx });
  const face = side === "top" || r.right + dx <= box.left + (lo * box.width) / 100 || r.left + dx >= box.left + (hi * box.width) / 100;
  return face && r.top >= 72 && r.bottom <= innerHeight - 8 && clearOf({ left: r.left + dx, top: r.top, right: r.right + dx, bottom: r.bottom }, host);
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
  // A line that hadn't come in yet was never charged, and doesn't hold off the next one.
  if (tl.time() >= DUR.quick) lastEnd = performance.now();
  tl.kill();
  if (now) el.remove();
  else gsap.to(el, { opacity: 0, y: -4, duration: DUR.quick, ease: EASE.in, onComplete: () => el.remove() });
}

/**
 * Joe says `id` in a caption bubble beside `host`, on the first of `sides`
 * that's clear, `delay` s from now (placed and checked now, so callers can
 * size their holds; pass the `pose` he'll be in by then). Returns the time
 * until it's gone (s), or 0 if it was skipped. A line is marked said and
 * charged to the budget only once it's in, so one dropped before then can
 * come back later.
 */
export function say(host: HTMLElement, id: QuipId, sides: QuipSide[], kind: QuipKind, delay = 0, pose = poseIn(host)): number {
  const t = tally();
  const html = document.documentElement.classList;
  if (t.said.includes(id) || joeHidden() || html.contains("fx-intro") || document.visibilityState !== "visible") return 0;
  if (chatOpen() && innerWidth < 640) return 0;
  if (kind !== "exempt" && t.n >= 6) return 0;
  if (kind === "auto" && (shown || t.auto >= 3 || thisPage().auto >= 2 || performance.now() - lastEnd < 12_000 || age(host) < 2500 || typing()))
    return 0;

  const el = document.createElement("span");
  el.setAttribute("data-joe-quip", "");
  el.dataset.testid = "joe-quip";
  el.setAttribute("aria-hidden", "true");
  el.textContent = QUIPS[id];
  host.append(el);
  shrink(el);
  const head = (pose && HEAD[pose]) || [42, 58];
  if (!sides.some((side) => fits(el, side, host, head))) return el.remove(), 0;

  // A prompted line takes over from a bubble that's showing: old one out, then this one in.
  const wait = delay + (shown ? DUR.quick : 0);
  drop();
  const hold = gsap.utils.clamp(1.8, 3.6, 1.2 + 0.05 * QUIPS[id].length);
  const charge = () => {
    const t = tally();
    t.said.push(id);
    if (kind !== "exempt") t.n++;
    if (kind === "auto") (t.auto++, thisPage().auto++);
    save(t);
  };
  const tl = gsap
    .timeline({ delay: wait, onComplete: () => (el.remove(), shown?.el === el && ((shown = null), (lastEnd = performance.now()))) })
    .fromTo(el, { opacity: 0, y: 6, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: DUR.base, ease: EASE.out })
    .call(charge, [], DUR.quick) // once it's in (the ease is at 97% by then)
    .to(el, { opacity: 0, y: -4, duration: DUR.quick, ease: EASE.in }, DUR.base + hold);
  shown = { el, host, tl };
  return wait + DUR.base + hold + DUR.quick;
}

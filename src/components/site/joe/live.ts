"use client";

import { gsap, whenDoorOpen } from "@/components/site/fx/gsap";
import { WRENCH, type Behavior, type JoeArtName, type PoseName, type QuipSide } from "./art";
import { anyBusy, join, joeHidden, listen, type Member } from "./cast";
import { JOE_HIDDEN_EVENT, JOE_PLUG_EVENT, type JoeHiddenDetail } from "./events";
import { DUR, EASE } from "./motion";
import { CLICKS, HERO_CLICKS, type MoveName } from "./moves";
import { peek } from "./peek";
import { count, markBorn, say, showing, type QuipId } from "./quips";
import { createRig } from "./rig";

export type Live = {
  click: () => void;
  hover: (on: boolean) => void;
  /** Shift his weight and flap the sign's face over, running `mid` while it's edge-on. */
  flip: (mid: () => void, manual?: boolean) => void;
  destroy: () => void;
};

/** Where each Joe's bubble may go (in order of preference), and which side of him the page content is on. */
const SIDES: Record<Behavior, QuipSide[]> = { hero: ["top"], noise: ["left", "top"], service: ["left", "top"], hours: ["right", "top"], peek: ["right", "top"] };
const LEAN: Record<Behavior, 1 | -1> = { hero: 1, noise: -1, service: -1, hours: 1, peek: 1 };
/** The line each click move earns (once per visit), and where on its timeline. */
const LINES: Partial<Record<MoveName, [QuipId, string]>> = {
  capTip: ["click-cap", "pose+=0.25"],
  thumbsUp: ["click-thumb", "pose+=0.25"],
  pointSpark: ["click-spark", "hit+=0.4"],
  wrenchSpin: ["click-catch", "hit+=0.25"],
};

type Ctx = Member & {
  /** A delayed call that dies with this Joe. */
  later: (s: number, fn: () => void) => void;
  /** Now and then, when the page is quiet, play `name` (at most `max` per page view, and only if `poses` are ready). */
  beats: (max: number, name: MoveName, poses: PoseName[]) => void;
};
type Setup = (ctx: Ctx) => (() => void) | void;

/** A once-per-visit flag in sessionStorage. */
const flag = (key: string, set?: boolean) => {
  try {
    if (set) sessionStorage.setItem(key, "1");
    return !!sessionStorage.getItem(key);
  } catch {
    return false;
  }
};

const BEHAVIORS: Partial<Record<Behavior, Setup>> = {
  hero: ({ rig, box, sides, later, beats }) => {
    // Hello, on the first home view of the visit: after the wordmark lands,
    // once he's on screen and the wave is ready (or not at all, after 10 s).
    let offDoor = () => {};
    if (!joeHidden() && !flag("joes-hello")) {
      rig.need(["wave"]);
      let until = 0;
      const hello = () => {
        if (performance.now() > until) return;
        const ready = () => rig.ratio() >= 0.5 && !joeHidden() && !anyBusy();
        if (!ready()) return later(0.5, hello);
        rig.need(["wave"], 1500).then((ok) => {
          const tl = ok && ready() ? rig.play("wave") : null;
          if (!tl) return later(0.5, hello);
          flag("joes-hello", true);
          tl.call(say, [box, "hero-hello", sides, "auto"], "pose+=0.25");
        });
      };
      offDoor = whenDoorOpen(() => later(2.2, () => ((until = performance.now() + 10_000), hello())));
    }
    // The plug's the show-off: on its third click of the visit, Joe just says so.
    const offPlug = listen(JOE_PLUG_EVENT, () => {
      if (count("plug") === 3 && rig.ratio() >= 0.5 && !anyBusy()) later(0.6, () => say(box, "plug-3", sides, "prompted"));
    });
    beats(2, "capTip", ["cap"]);
    return () => (offDoor(), offPlug());
  },
  service: ({ rig, box, art, sides, later, beats }) => {
    // He presents his prop (or wrench) once he's half on screen; the line only on the visit's first service page.
    // Not before 2.5 s after going live, when Joe may volunteer a line at all.
    const born = performance.now();
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio < 0.5) return;
        io.disconnect();
        later(Math.max(0.6, 2.6 - (performance.now() - born) / 1000), () => {
          const t = count("svc") === 1 ? say(box, `svc-${art}` as QuipId, sides, "auto", DUR.snap) : 0;
          rig.play("present", { dur: Math.max(1.2, t + 0.25) });
        });
      },
      { threshold: 0.5 },
    );
    io.observe(box);
    beats(1, "present", []);
    return () => io.disconnect();
  },
  peek: (ctx) => peek(ctx),
};

/** A dash-style check-engine light, just past his pointing fingertip. */
const warnLight = () => {
  const el = document.createElement("span");
  el.dataset.warn = "";
  el.setAttribute("aria-hidden", "true");
  el.className = "pointer-events-none absolute left-[94%] top-[14%] w-[16%] opacity-0";
  el.style.zIndex = "999";
  el.innerHTML =
    '<svg viewBox="0 0 48 38" class="block w-full" aria-hidden="true"><rect x="1" y="1" width="46" height="36" rx="7" fill="#12100e" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/><path d="M11 15h5v-4h10v4h5l4 4v8l-4 4h-5v3H16l-5-5H8V15z" fill="#ffb02e"/></svg>';
  return el;
};

/** The loose wrench for the toss, starting in his open hand. */
const looseWrench = () => {
  const el = document.createElement("img");
  el.src = WRENCH;
  el.alt = "";
  el.draggable = false;
  el.dataset.wrench = "";
  el.className = "pointer-events-none absolute left-[13%] top-[24%] w-[30%] opacity-0";
  el.style.zIndex = "999";
  return el;
};

/** Bring a server-rendered Joe to life. Returns at once: poses are fetched only when he's about to use them. */
export function goLive(box: HTMLElement, art: JoeArtName, behavior: Behavior): Live {
  const sides = SIDES[behavior];
  const rig = createRig(box, {
    rest: art,
    behavior,
    lean: LEAN[behavior],
    clicks: behavior === "hero" ? HERO_CLICKS : art === "base" ? CLICKS : ["present"],
    props: { wrench: looseWrench, warn: warnLight },
    onClick: (name, tl) => {
      const line = name === "present" ? ([`svc-${art}`, "pose"] as [QuipId, string]) : LINES[name];
      if (line) tl.call(say, [box, line[0], sides, "prompted"], line[1]);
    },
  });
  markBorn(box);
  if (behavior === "peek") gsap.set(box, { opacity: 1, xPercent: -16, yPercent: 100 });
  const me: Member = { behavior, rig, box, art, sides };
  const leave = join(me);
  const offHidden = listen<JoeHiddenDetail>(JOE_HIDDEN_EVENT, ({ hidden }) => rig.setHidden(hidden));

  let dead = false;
  const timers = new Set<gsap.core.Tween>();
  const later = (s: number, fn: () => void) => {
    if (dead) return;
    const t = gsap.delayedCall(s, () => (timers.delete(t), fn()));
    timers.add(t);
  };
  let over = false;
  let overAt = -Infinity;
  const beats = (max: number, name: MoveName, poses: PoseName[]) => {
    const quiet = () => !anyBusy() && rig.ratio() >= 0.5 && !over && performance.now() - overAt > 8000 && !showing() && !joeHidden();
    let n = 0;
    const next = () =>
      later(gsap.utils.random(20, 30), async () => {
        if (quiet() && (await rig.need(poses, 1500)) && quiet() && rig.play(name)) n++;
        if (n < max) next();
      });
    next();
  };
  const off = BEHAVIORS[behavior]?.({ ...me, later, beats });

  const face = box.querySelector<HTMLElement>("[data-sign-face]");
  let flipTl: gsap.core.Timeline | undefined;
  let flips = 0;

  return {
    click: rig.click,
    hover: (on) => {
      over = on;
      overAt = performance.now();
      rig.hover(on);
    },
    flip: (mid, manual) => {
      if (!face) return mid();
      flipTl?.progress(1);
      rig.play("shift");
      // A departure-board flap: over the top edge-on, swap, and down the other side.
      flipTl = gsap
        .timeline()
        .set(face, { transformPerspective: 500, transformOrigin: "50% 50%" })
        .to(face, { rotationX: -90, duration: DUR.quick, ease: EASE.in })
        .call(mid)
        .set(face, { rotationX: 90 })
        .to(face, { rotationX: 0, duration: DUR.base, ease: EASE.out }, "+=0.03");
      if (manual && ++flips === 3) later(0.5, () => say(box, "hours-flips", sides, "prompted"));
    },
    destroy: () => {
      dead = true;
      timers.forEach((t) => t.kill());
      off?.();
      offHidden();
      leave();
      flipTl?.kill();
      if (face) gsap.set(face, { clearProps: "all" });
      rig.destroy();
    },
  };
}

"use client";

import { gsap } from "@/components/site/fx/gsap";
import { chatOpen, joeHidden, listen, residentVisible, type Member } from "./cast";
import { JOE_CHAT_EVENT, JOE_HIDDEN_EVENT, type JoeChatDetail, type JoeHiddenDetail } from "./events";
import { DUR, EASE } from "./motion";
import { clearOf, drop } from "./quips";

/** Box yPercent when he's up (cropped mid-thigh by the window edge) and when he's out of sight. */
const UP = 34;
const DOWN = 100;
/** The home sections and the noise decoder (home.ts, loaded only on a page that has them). */
const HOME = "#services,#noise,#inspection,#text-joe";

/** The corner Joe, as home.ts and chat.ts drive him. */
export type Corner = {
  me: Member;
  /** His corner is clear: no control or text under the part of him that shows, and no other Joe on screen. */
  clear: () => boolean;
  /** He's down and free to rise for a section: not hidden, nothing else on, and his corner is clear. */
  free: () => boolean;
  /** Rise into the corner and run `then` 0.3 s in; if he's already up, he just switches gesture. */
  rise: (then: () => void) => void;
  /** In `hold` s: bubble out, cut to rest, and duck 0.12 s later. */
  duck: (hold?: number) => void;
  /** Take the next turn: the returned check turns false once a newer event takes over. */
  turn: () => () => boolean;
  /** The booking celebration runs until then (ms). */
  party: number;
};

/**
 * Joe "over the counter": he rises into the bottom-left corner, cropped by
 * the window edge, makes one gesture, says at most one thing and ducks back
 * down. He points out home sections and stands in for the resident Joes
 * (cast.lead) when the noise decoder (home.ts) or the shop assistant
 * (chat.ts) wants a reaction and none of them is on screen; that code loads
 * only when it's needed. He rises only over a clear corner and gets out of
 * the way the moment anything scrolls or opens under him.
 */
export function peek(me: Member): () => void {
  const { rig, box } = me;
  let target = DOWN;
  let next: gsap.core.Tween | undefined; // the pending gesture or duck
  let watchT: gsap.core.Tween | undefined;
  let fromY = 0;
  // Bumped by every event, so a reaction still waiting on a pose gives way to a newer one.
  let seq = 0;

  const slide = (y: number, dur: number, ease: string, delay = 0) => {
    gsap.killTweensOf(box);
    target = y;
    if (y === UP) gsap.set(box, { opacity: 1, willChange: "transform" });
    gsap.to(box, { yPercent: y, duration: dur, ease, delay, onComplete: () => void (y === DOWN && gsap.set(box, { willChange: "auto" })) });
  };
  /** Out of the way at once (the planned exit is `duck`): bubble gone, down and faded in a beat. */
  const leave = () => {
    next?.kill();
    drop(box, true);
    rig.stop();
    slide(DOWN, DUR.quick, EASE.in);
    gsap.to(box, { opacity: 0, duration: DUR.snap, ease: EASE.inOut });
  };
  /** While he's up, look again every 0.25 s: content opening under him, or another Joe coming on screen, sends him down. */
  const watch = () => {
    watchT?.kill();
    watchT = gsap.delayedCall(0.25, () => target === UP && (c.clear() ? watch() : leave()));
  };

  const c: Corner = {
    me,
    clear: () =>
      !residentVisible() &&
      clearOf({ left: 0, top: innerHeight - 0.66 * box.offsetHeight, right: 0.84 * box.offsetWidth, bottom: innerHeight }, box, 16),
    free: () =>
      target === DOWN &&
      !joeHidden() &&
      document.visibilityState === "visible" &&
      !document.documentElement.classList.contains("fx-intro") &&
      !chatOpen() &&
      performance.now() > c.party &&
      !rig.busy() &&
      c.clear(),
    rise: (then) => {
      next?.kill();
      fromY = scrollY;
      if (target === UP) return then();
      slide(UP, DUR.slow, EASE.out);
      watch();
      next = gsap.delayedCall(0.3, then);
    },
    duck: (hold = 0) => {
      next?.kill();
      next = gsap.delayedCall(hold, () => {
        drop(box);
        rig.stop();
        if (target === UP) slide(DOWN, DUR.base, EASE.in, 0.12);
      });
    },
    turn: () => {
      const mine = ++seq;
      return () => mine === seq;
    },
    party: 0,
  };

  const onScroll = () => target === UP && Math.abs(scrollY - fromY) > 24 && leave();
  const onResize = () => target === UP && leave();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  let dead = false;
  const offs: (() => void)[] = [];
  // Home: section peeks and the noise decoder, once a page has them (the peek lives in the site layout, so look again after client-side navigation).
  const scan = () => {
    if (!document.querySelector(HOME)) return;
    mo.disconnect();
    import("./home").then((m) => void (dead || offs.push(m.home(c))), () => {});
  };
  const mo = new MutationObserver(scan);
  const main = document.querySelector("main");
  if (main) mo.observe(main, { childList: true });
  scan();

  // Shop assistant: its reactions load with the first chat event.
  let chat: Promise<(d: JoeChatDetail) => void> | undefined;
  const offChat = listen<JoeChatDetail>(JOE_CHAT_EVENT, (d) => {
    chat ??= import("./chat").then((m) => {
      if (dead) return () => {};
      const [on, off] = m.chat(c);
      offs.push(off);
      return on;
    });
    chat.then((on) => dead || on(d), () => {});
  });

  const offHidden = listen<JoeHiddenDetail>(JOE_HIDDEN_EVENT, ({ hidden }) => {
    if (!hidden) return;
    seq++;
    [next, watchT].forEach((t) => t?.kill());
    gsap.killTweensOf(box);
    target = DOWN;
    c.party = 0;
    gsap.set(box, { yPercent: DOWN, willChange: "auto" });
  });

  return () => {
    dead = true;
    offs.forEach((off) => off());
    offChat();
    offHidden();
    mo.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    [next, watchT].forEach((t) => t?.kill());
    gsap.killTweensOf(box);
  };
}

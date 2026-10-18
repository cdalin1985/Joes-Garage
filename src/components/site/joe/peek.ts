"use client";

import { gsap } from "@/components/site/fx/gsap";
import type { Rig } from "./rig";
import { SOUND_MOVES, type MoveName } from "./moves";
import { JOE_CHAT_EVENT, JOE_NOISE_EVENT, type JoeChatDetail, type JoeNoiseDetail } from "./events";

/** Moves the peek plays besides the noise reactions. */
export const PEEK_MOVES: MoveName[] = ["point", "wave", "thumbsUp", "think"];

/** Sections Joe peeks in and points at, once per visit. */
const SECTIONS = ["services", "noise", "inspection", "text-joe"];
const SEEN_KEY = "joes-peek";

const seen = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const markSeen = (id: string) => {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen(), id]));
  } catch {
    /* storage unavailable */
  }
};

/**
 * Small Joe sliding in from the left edge: points at sections as they come
 * into view, acts out noise examples on phones/tablets (the big noise Joe is
 * desktop-only), and reacts to the shop assistant on larger screens.
 */
export function peek(rig: Rig, el: HTMLElement) {
  const below = (px: number) => !window.matchMedia(`(min-width: ${px}px)`).matches;
  const hidden = { opacity: 1, xPercent: -120 };
  const shown = { opacity: 1, xPercent: -10 };
  gsap.set(el, hidden);

  let show: gsap.core.Timeline | null = null;
  let move: MoveName | null = null;
  const queue: string[] = [];

  const perform = (m: MoveName, hold: number) => {
    show?.kill();
    move = m;
    show = gsap
      .timeline({ onComplete: () => ((show = null), (move = null), next()) })
      .to(el, { ...shown, duration: 0.45, ease: "back.out(1.4)" })
      .call(() => void rig.play(m, hold), [], 0.2)
      .to(el, { ...hidden, duration: 0.4, ease: "power2.in" }, 0.2 + hold + 0.35);
  };
  const finish = () => {
    if (!show) return;
    rig.stop();
    show.seek(Math.max(show.time(), show.duration() - 0.4));
  };
  function next() {
    const id = queue.shift();
    if (id) perform("point", below(1024) ? 1.6 : 2.6);
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const id = e.target.id;
        if (!e.isIntersecting || seen().includes(id)) continue;
        markSeen(id);
        queue.push(id);
        if (!show) next();
      }
    },
    { rootMargin: "-35% 0px -35% 0px" },
  );
  SECTIONS.forEach((id) => {
    const s = document.getElementById(id);
    if (s) io.observe(s);
  });

  const onNoise = (e: Event) => {
    if (!below(1024)) return;
    const { sound } = (e as CustomEvent<JoeNoiseDetail>).detail;
    if (sound) perform(SOUND_MOVES[sound], sound === "none" ? 2.2 : 2.5);
    else finish();
  };
  // On phones the assistant covers the whole screen, so Joe only reacts on wider ones.
  const onChat = (e: Event) => {
    if (below(640)) return;
    const { state } = (e as CustomEvent<JoeChatDetail>).detail;
    if (state === "open") perform("wave", 2);
    else if (state === "waiting") perform("think", 30);
    else if (state === "booked") perform("thumbsUp", 1.8);
    else if (move === "think" || state === "closed") finish();
  };
  window.addEventListener(JOE_NOISE_EVENT, onNoise);
  window.addEventListener(JOE_CHAT_EVENT, onChat);

  return () => {
    io.disconnect();
    window.removeEventListener(JOE_NOISE_EVENT, onNoise);
    window.removeEventListener(JOE_CHAT_EVENT, onChat);
    show?.kill();
  };
}

"use client";

import { chatOpen, joeHidden, lead, listen, type Member } from "./cast";
import { JOE_NOISE_EVENT, type JoeNoiseDetail } from "./events";
import { DUR } from "./motion";
import { MOVES, SOUND_MOVES, type MoveName } from "./moves";
import type { Corner } from "./peek";
import { age, count, say, type QuipId } from "./quips";

/** Home sections Joe peeks up beside, once per visit, and the gesture he makes. */
const SECTIONS: Record<string, MoveName> = { services: "point", noise: "listen", inspection: "point", "text-joe": "thumbsUp" };
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
    if (!seen().includes(id)) sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen(), id]));
  } catch {
    /* storage unavailable */
  }
};

/** A resident Joe is laid out in this section (desktop), so he reacts there instead. */
const residentIn = (id: string) =>
  [...(document.getElementById(id)?.querySelectorAll("[data-joe]") ?? [])].some((el) => el.getClientRects().length > 0);
/** Where the section's top edge is in the window (px), or null when it isn't on screen. */
const topOnScreen = (id: string) => {
  const top = document.getElementById(id)?.getBoundingClientRect().top ?? -1;
  return top >= 0 && top < innerHeight ? top : null;
};

/**
 * The corner Joe on the home page. Section peeks: when the visitor stops
 * scrolling with a section's top edge on screen and his corner clear (in
 * practice, the gap between two sections), he rises and points at the start
 * of the section he names (at most 2 per page view, 20 s apart). Noise
 * decoder: the lead resident acts out each example sound, else he does.
 */
export function home({ me, clear, free, rise, duck, turn }: Corner): () => void {
  const { rig, box, sides } = me;
  let path = "";
  let peeks = 0;
  let last = -Infinity;
  const tried = new Map<string, number>();

  const tryPeek = async () => {
    if (path !== location.pathname) {
      path = location.pathname;
      peeks = 0;
      tried.clear();
    }
    const now = performance.now();
    // The section starting lowest on screen. Each gets 5 s from its first try to find a clear moment,
    // then it's left for this page view (not marked seen).
    const [id] = Object.keys(SECTIONS)
      .filter((s) => topOnScreen(s) !== null && !seen().includes(s) && !residentIn(s) && now - (tried.get(s) ?? now) <= 5000)
      .sort((a, b) => topOnScreen(b)! - topOnScreen(a)!);
    if (!id) return;
    if (!tried.has(id)) tried.set(id, now);
    if (peeks >= 2 || now - last < 20_000 || age(box) < 3000 || !free()) return;
    const gesture = SECTIONS[id];
    const mine = turn();
    if (!(await rig.need(["base", ...MOVES[gesture].poses], 1500)) || !mine() || topOnScreen(id) === null || !free()) return;
    markSeen(id);
    peeks++;
    last = performance.now();
    rise(() => {
      const t = say(box, `peek-${id}` as QuipId, sides, "auto", DUR.snap + 0.25, MOVES[gesture].poses[0]);
      const hold = Math.max(1.6, t + 0.25);
      rig.play(gesture, { dur: hold });
      duck(hold);
    });
  };
  // Once the reader has stopped scrolling.
  let settleId = 0;
  const settle = () => {
    window.clearTimeout(settleId);
    settleId = window.setTimeout(tryPeek, 600);
  };
  window.addEventListener("scroll", settle, { passive: true });

  // ── Noise decoder: the lead resident reacts, else the corner Joe if his corner is clear ──
  let noiseBy: Member | null = null;
  const offNoise = listen<JoeNoiseDetail>(JOE_NOISE_EVENT, async ({ sound, armed }) => {
    if (joeHidden()) return;
    const m = lead();
    // Armed: a sound is about to play, so fetch its pose and nothing else.
    if (armed) {
      const poses = sound ? MOVES[SOUND_MOVES[sound]].poses : [];
      if (m) m.rig.need(poses);
      else if (sound && !chatOpen() && clear()) rig.need(["base", ...poses]);
      return;
    }
    const mine = turn();
    if (!sound) {
      noiseBy?.rig.stop();
      if (noiseBy === me) duck();
      noiseBy = null;
      return;
    }
    // They've found the decoder: no need to point it out.
    markSeen("noise");
    const name = SOUND_MOVES[sound];
    const dur = sound === "none" ? 2.2 : 2.5;
    // A line for the first two sounds of the visit, once he's heard it.
    const line = count("noise") <= 2 ? (`noise-${sound}` as QuipId) : null;
    const speak = (who: Member, tl: gsap.core.Timeline | null) => void (tl && line && tl.call(say, [who.box, line, who.sides, "prompted"], "pose+=0.35"));
    if (m) {
      noiseBy = m;
      return m.rig.perform(name, { dur, onStart: (tl) => speak(m, tl) });
    }
    if (chatOpen() || !clear()) return;
    rig.need(MOVES[name].poses); // it may land late: the move then plays motion-only
    if (!(await rig.need(["base"], 700)) || !mine()) return;
    noiseBy = me;
    rise(() => {
      speak(me, rig.play(name, { dur }));
      duck(dur + 1); // in case the decoder never says it stopped
    });
  });

  return () => {
    offNoise();
    window.clearTimeout(settleId);
    window.removeEventListener("scroll", settle);
  };
}

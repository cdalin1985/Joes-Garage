"use client";

import { gsap } from "@/components/site/fx/gsap";
import { chatOpen, joeHidden, lead, listen, residentOnScreen, type Member } from "./cast";
import {
  JOE_CHAT_EVENT,
  JOE_HIDDEN_EVENT,
  JOE_NOISE_EVENT,
  type JoeChatDetail,
  type JoeHiddenDetail,
  type JoeNoiseDetail,
} from "./events";
import { DUR, EASE } from "./motion";
import { MOVES, SOUND_MOVES, type MoveName } from "./moves";
import { clearOf, count, drop, say, type QuipId } from "./quips";
import { sparks } from "./sparks";

/** Home sections Joe peeks up beside, once per visit, and the gesture he makes. */
const SECTIONS: Record<string, MoveName> = { services: "point", noise: "listen", inspection: "point", "text-joe": "thumbsUp" };
const SEEN_KEY = "joes-peek";
/** Box yPercent when he's up (cropped mid-thigh by the window edge) and when he's out of sight. */
const UP = 34;
const DOWN = 100;

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

/** A resident Joe is laid out in this section (desktop), so he reacts there instead. */
const residentIn = (id: string) =>
  [...(document.getElementById(id)?.querySelectorAll("[data-joe]") ?? [])].some((el) => el.getClientRects().length > 0);

/**
 * Joe "over the counter": he rises into the bottom-left corner, cropped by
 * the window edge, makes one gesture, says at most one thing and ducks back
 * down. He points out home sections as they come into view, and stands in
 * for the resident Joes (cast.lead) when the noise decoder or the shop
 * assistant wants a reaction and none of them is on screen.
 */
export function peek(me: Member): () => void {
  const { rig, box, sides } = me;
  const born = performance.now();
  let target = DOWN;
  let boxTw: gsap.core.Tween | undefined;
  let next: gsap.core.Tween | undefined; // the pending gesture or duck
  let fromY = 0;
  // Bumped by every event, so a reaction still waiting on a pose gives way to a newer one.
  let seq = 0;

  /** The part of him that shows when he's up covers no link, button or field. */
  const guard = () => clearOf({ left: 0, top: innerHeight - 0.66 * box.offsetHeight, right: 0.84 * box.offsetWidth, bottom: innerHeight }, box);
  const slide = (y: number, dur: number, ease: string, delay = 0) => {
    boxTw?.kill();
    target = y;
    if (y === UP) gsap.set(box, { willChange: "transform" });
    boxTw = gsap.to(box, { yPercent: y, duration: dur, ease, delay, onComplete: () => void (y === DOWN && gsap.set(box, { willChange: "auto" })) });
  };
  /** Rise into the corner and run `then` 0.3 s in; if he's already up, he just switches gesture. */
  const rise = (then: () => void) => {
    next?.kill();
    fromY = scrollY;
    if (target === UP) return then();
    slide(UP, DUR.slow, EASE.out);
    next = gsap.delayedCall(0.3, then);
  };
  /** In `hold` s: bubble out, cut to rest, and duck 0.12 s later. */
  const duck = (hold = 0) => {
    next?.kill();
    next = gsap.delayedCall(hold, () => {
      drop(box);
      rig.stop();
      if (target === UP) slide(DOWN, DUR.base, EASE.in, 0.12);
    });
  };

  // ── Chat state (the peek is the only Joe in every page's layout, so it routes for everyone) ──
  let thinker: Member | null = null;
  let party = 0; // the booking celebration runs until then (ms)
  let deferred = -Infinity; // when a booking on a phone was saved for after the chat closes
  let waitT: gsap.core.Tween | undefined;
  const partying = () => performance.now() < party;

  // ── Section peeks ─────────────────────────────────────────────────────
  let path = "";
  let peeks = 0;
  let waits = 0;
  let last = -Infinity;
  const band = new Set<string>();
  const tried = new Map<string, number>();
  const spent = () => peeks >= 2 || Object.keys(SECTIONS).every((id) => seen().includes(id));
  const quiet = () =>
    !joeHidden() &&
    document.visibilityState === "visible" &&
    !document.documentElement.classList.contains("fx-intro") &&
    !chatOpen() &&
    !residentOnScreen() &&
    !partying() &&
    !rig.busy() &&
    target === DOWN;

  const tryPeek = async () => {
    const now = performance.now();
    if (spent() || now - last < 20_000 || now - born < 3000 || !quiet() || !guard()) return;
    // A section that couldn't get a clear spot for 5 s is left for this page view (not marked seen).
    const id = [...band].find((s) => !seen().includes(s) && !residentIn(s) && now - (tried.get(s) ?? now) <= 5000);
    if (!id) return;
    if (!tried.has(id)) tried.set(id, now);
    const gesture = SECTIONS[id];
    const mine = ++seq;
    if (!(await rig.need(["base", ...MOVES[gesture].poses], 1500)) || mine !== seq || !band.has(id) || !quiet() || !guard()) return;
    markSeen(id);
    peeks++;
    last = performance.now();
    if (spent()) (inBand.disconnect(), ahead.disconnect(), band.clear());
    rise(() => {
      const t = say(box, `peek-${id}` as QuipId, sides, "auto", DUR.snap + 0.25);
      const hold = Math.max(1.6, t + 0.25);
      rig.play(gesture, { dur: hold });
      duck(hold);
    });
  };

  let settleId = 0;
  const settle = () => {
    window.clearTimeout(settleId);
    if (band.size) settleId = window.setTimeout(tryPeek, 220);
  };
  const inBand = new IntersectionObserver(
    (es) => (es.forEach((e) => (e.isIntersecting ? band.add(e.target.id) : band.delete(e.target.id))), settle()),
    { rootMargin: "-35% 0px -35% 0px" },
  );
  // Fetch a section's gesture when it's within a screen of coming into view.
  const ahead = new IntersectionObserver(
    (es) =>
      es.forEach(({ isIntersecting, target: { id } }) => {
        if (isIntersecting && !spent() && !joeHidden() && !seen().includes(id) && !residentIn(id)) rig.need(["base", ...MOVES[SECTIONS[id]].poses]);
      }),
    { rootMargin: "0px 0px 100% 0px" },
  );
  // The peek lives in the site layout, so look again for sections after client-side navigation.
  const scan = () => {
    if (path !== location.pathname) {
      path = location.pathname;
      peeks = waits = 0;
      band.clear();
      tried.clear();
      inBand.disconnect();
      ahead.disconnect();
    }
    if (spent()) return;
    for (const id in SECTIONS) {
      const s = document.getElementById(id);
      if (s) (inBand.observe(s), ahead.observe(s));
    }
  };
  const mo = new MutationObserver(scan);
  const main = document.querySelector("main");
  if (main) mo.observe(main, { childList: true });
  scan();

  const onScroll = () => {
    if (target === UP && Math.abs(scrollY - fromY) > 64) duck();
    settle();
  };
  const onResize = () => target === UP && duck();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  // ── Noise decoder: the lead resident reacts, else the peek ─────────────
  let noiseBy: Member | null = null;
  const offNoise = listen<JoeNoiseDetail>(JOE_NOISE_EVENT, async ({ sound, armed }) => {
    const m = lead();
    // Armed: a sound is about to play, so fetch its pose and nothing else.
    if (armed) {
      const poses = sound ? MOVES[SOUND_MOVES[sound]].poses : [];
      if (m) m.rig.need(poses);
      else if (sound) rig.need(["base", ...poses]);
      return;
    }
    const mine = ++seq;
    if (!sound) {
      noiseBy?.rig.stop();
      if (noiseBy === me) duck();
      noiseBy = null;
      return;
    }
    const name = SOUND_MOVES[sound];
    const dur = sound === "none" ? 2.2 : 2.5;
    // A line for the first two sounds of the visit, once he's heard it.
    const line = count("noise") <= 2 ? (`noise-${sound}` as QuipId) : null;
    const speak = (who: Member, tl: gsap.core.Timeline | null) => void (tl && line && tl.call(say, [who.box, line, who.sides, "prompted"], "pose+=0.35"));
    if (m) {
      noiseBy = m;
      return m.rig.perform(name, { dur, onStart: (tl) => speak(m, tl) });
    }
    rig.need(MOVES[name].poses); // it may land late: the move then plays motion-only
    if (joeHidden() || chatOpen() || !guard() || !(await rig.need(["base"], 700)) || mine !== seq) return;
    noiseBy = me;
    rise(() => {
      speak(me, rig.play(name, { dur }));
      duck(dur + 1); // in case the decoder never says it stopped
    });
  });

  // ── Shop assistant ────────────────────────────────────────────────────
  /** Play `name` on the performer: the lead resident (prop and sign Joes present instead), else the peek if his corner is clear. */
  const act = async (name: MoveName, dur: number, hold: number, line?: QuipId): Promise<Member | null> => {
    const mine = ++seq;
    const m = lead();
    if (m) {
      const move = m.art === "base" ? name : "present";
      await m.rig.need(MOVES[move].poses, 300);
      const tl = mine === seq ? m.rig.play(move, { dur }) : null;
      if (tl && line) tl.call(say, [m.box, line, m.sides, "prompted"], "pose+=0.25");
      return tl && m;
    }
    rig.need(MOVES[name].poses);
    if (joeHidden() || !guard() || !(await rig.need(["base"], 1500)) || mine !== seq) return null;
    rise(() => {
      const t = line ? say(box, line, sides, "prompted", DUR.snap + 0.25) : 0;
      rig.play(name, { dur: Math.max(dur, t) });
      duck(Math.max(hold, t + 0.25));
    });
    return me;
  };

  /** Booking: thumbs up, a jig and a cap tip (or, if those poses are late or he's holding a prop, a lift and sparks), then the line. */
  const celebrate = async () => {
    const mine = ++seq;
    party = performance.now() + 6000; // upper bound until the move is built
    const m = lead() ?? me;
    const jig = m.art === "base" && (await m.rig.need(MOVES.celebrate.poses, 1500));
    if (mine !== seq || (m === me && (joeHidden() || !guard() || !(await rig.need(["base"], 1500))))) return void (party = 0);
    const go = () => {
      const tl = m.rig.play(jig ? "celebrate" : "present");
      if (!tl) return void (party = 0);
      if (!jig) (tl.addLabel("hit", 0.31), sparks(tl, m.box.querySelector<HTMLElement>("[data-joe-idle]")!, 55, 5, 0.31));
      const t = say(m.box, "chat-booked", m.sides, "exempt", tl.labels.hit + 0.25);
      party = performance.now() + tl.duration() * 1000;
      if (m === me) duck(Math.max(tl.duration(), t));
    };
    if (m === me) rise(go);
    else go();
  };

  const offChat = listen<JoeChatDetail>(JOE_CHAT_EVENT, ({ state }) => {
    waitT?.kill();
    if (state === "booked") {
      thinker = null;
      if (joeHidden()) return;
      // On a phone the chat covers the screen: save it for when it closes.
      if (innerWidth < 640) deferred = performance.now();
      else celebrate();
      return;
    }
    // The assistant fires "replied" right after "booked": let the celebration finish.
    if (partying()) return;
    seq++;
    if (state === "closed") {
      thinker?.rig.stop();
      thinker = null;
      duck();
      if (performance.now() - deferred < 300_000) {
        deferred = -Infinity;
        celebrate();
      }
      return;
    }
    if (innerWidth < 640 || joeHidden()) return;
    if (state === "open") act("point", 1.6, 1.6, "chat-open");
    else if (state === "waiting")
      waitT = gsap.delayedCall(1.2, () => {
        if (lead() || waits++ < 2) act("think", 30, 30).then((m) => (thinker = m));
      });
    else if (thinker) {
      const m = thinker;
      thinker = null;
      m.rig.play(m.art === "base" ? "nod" : "present");
      if (m === me) duck(0.6);
    }
  });

  const offHidden = listen<JoeHiddenDetail>(JOE_HIDDEN_EVENT, ({ hidden }) => {
    if (!hidden) return;
    seq++;
    next?.kill();
    boxTw?.kill();
    target = DOWN;
    thinker = null;
    party = 0;
    gsap.set(box, { yPercent: DOWN, willChange: "auto" });
  });

  return () => {
    offNoise();
    offChat();
    offHidden();
    inBand.disconnect();
    ahead.disconnect();
    mo.disconnect();
    window.clearTimeout(settleId);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    [next, boxTw, waitT].forEach((t) => t?.kill());
  };
}

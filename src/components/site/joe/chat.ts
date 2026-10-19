"use client";

import { gsap } from "@/components/site/fx/gsap";
import { joeHidden, lead, listen, type Member } from "./cast";
import { JOE_HIDDEN_EVENT, type JoeChatDetail, type JoeHiddenDetail } from "./events";
import { DUR } from "./motion";
import { MOVES, type MoveName } from "./moves";
import type { Corner } from "./peek";
import { say, type QuipId } from "./quips";
import { sparks } from "./sparks";

/**
 * Joe reacts to the shop assistant: the lead resident if one is half on
 * screen (prop and sign Joes present instead), else the corner Joe if his
 * corner is clear. Loaded with the first chat event; returns the event
 * handler and the cleanup.
 */
export function chat(c: Corner): [(d: JoeChatDetail) => void, () => void] {
  const { me, clear, rise, duck, turn } = c;
  const { rig, box, sides } = me;
  let thinker: Member | null = null;
  let deferred = -Infinity; // when a booking on a phone was saved for after the chat closes
  let waitT: gsap.core.Tween | undefined;
  let waits = { path: "", n: 0 }; // the corner Joe thinks along at most twice per page view

  /** Play `name` on the performer. */
  const act = async (name: MoveName, dur: number, hold: number, line?: QuipId): Promise<Member | null> => {
    const mine = turn();
    const m = lead();
    if (m) {
      const move = m.art === "base" ? name : "present";
      await m.rig.need(MOVES[move].poses, 300);
      const tl = mine() ? m.rig.play(move, { dur }) : null;
      if (tl && line) tl.call(say, [m.box, line, m.sides, "prompted"], "pose+=0.25");
      return tl && m;
    }
    if (joeHidden() || !clear()) return null;
    rig.need(MOVES[name].poses);
    // Re-check after the wait: a resident Joe may have scrolled into view, or the corner filled.
    if (!(await rig.need(["base"], 1500)) || !mine() || lead() || joeHidden() || !clear()) return null;
    rise(() => {
      const t = line ? say(box, line, sides, "prompted", DUR.snap + 0.25, MOVES[name].poses[0]) : 0;
      rig.play(name, { dur: Math.max(dur, t) });
      duck(Math.max(hold, t + 0.25));
    });
    return me;
  };

  /** Booking: thumbs up, a jig and a cap tip (or, if those poses are late or he's holding a prop, a lift), sparks off the brim, then the line. */
  const celebrate = async () => {
    const mine = turn();
    const m = lead() ?? me;
    if (m === me && (joeHidden() || !clear())) return;
    c.party = performance.now() + 6000; // upper bound until the move is built
    const jig = m.art === "base" && (await m.rig.need(MOVES.celebrate.poses, 1500));
    // For the corner Joe, re-check after the waits (see act).
    if (!mine() || (m === me && (!(await rig.need(["base"], 1500)) || !mine() || lead() || joeHidden() || !clear())))
      return void (c.party = 0);
    const go = () => {
      const tl = m.rig.play(jig ? "celebrate" : "present");
      if (!tl) return void (c.party = 0);
      if (!jig) tl.addLabel("hit", 0.31);
      // Off the cap brim as he lands the cap tip (or lifts his prop).
      sparks(tl, m.box.querySelector<HTMLElement>("[data-joe-idle]")!, 55, 5, jig ? 1.81 : 0.31);
      const t = say(m.box, jig ? "chat-booked" : "chat-booked-plain", m.sides, "exempt", tl.labels.hit + 0.25, jig ? "cap" : m.art);
      c.party = performance.now() + tl.duration() * 1000;
      if (m === me) duck(Math.max(tl.duration(), t));
    };
    if (m === me) rise(go);
    else go();
  };

  const on = ({ state }: JoeChatDetail) => {
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
    if (performance.now() < c.party) return;
    turn();
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
        if (waits.path !== location.pathname) waits = { path: location.pathname, n: 0 };
        if (lead() || waits.n++ < 2) act("think", 30, 30).then((m) => (thinker = m));
      });
    else if (thinker) {
      const m = thinker;
      thinker = null;
      m.rig.play(m.art === "base" ? "nod" : "present");
      if (m === me) duck(0.6);
    }
  };

  const offHidden = listen<JoeHiddenDetail>(JOE_HIDDEN_EVENT, ({ hidden }) => hidden && (thinker = null));
  return [on, () => (offHidden(), waitT?.kill())];
}

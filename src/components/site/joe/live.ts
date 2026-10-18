"use client";

import { gsap, whenDoorOpen } from "@/components/site/fx/gsap";
import { createRig, type Rig } from "./rig";
import { CLICK_MOVES, PROP_CLICKS, SOUND_MOVES, posesFor, type MoveName } from "./moves";
import { POSES, type Behavior, type JoeArtName, type PoseName } from "./art";
import { JOE_NOISE_EVENT, type JoeNoiseDetail } from "./events";
import { peek, PEEK_MOVES } from "./peek";

export type Live = {
  click: () => void;
  hover: (on: boolean) => void;
  /** Nod and flip the sign's painted face edge-on, running `mid` while it's invisible. */
  flip: (mid: () => void) => void;
  destroy: () => void;
};

type Ctx = { rig: Rig; box: HTMLElement; art: JoeArtName };
type Setup = (ctx: Ctx) => (() => void) | void;

const NOISE_MOVES = Object.values(SOUND_MOVES);

/** Moves (and so poses) each behaviour can play. */
const USES: Record<Behavior, MoveName[]> = {
  hero: [...CLICK_MOVES, "wave"],
  noise: [...CLICK_MOVES, ...NOISE_MOVES],
  service: CLICK_MOVES,
  hours: [],
  peek: [...PEEK_MOVES, ...NOISE_MOVES],
};

const listen = <T>(type: string, fn: (d: T) => void) => {
  const on = (e: Event) => fn((e as CustomEvent<T>).detail);
  window.addEventListener(type, on);
  return () => window.removeEventListener(type, on);
};

const BEHAVIORS: Record<Behavior, Setup> = {
  hero: ({ rig }) => {
    let hello: gsap.core.Tween | undefined;
    const off = whenDoorOpen(() => void (hello = gsap.delayedCall(1.4, () => void rig.play("wave"))));
    rig.startIdle({ fidgets: ["tap", "wave"] });
    return () => (off(), hello?.kill());
  },
  noise: ({ rig }) => {
    rig.startIdle();
    return listen<JoeNoiseDetail>(JOE_NOISE_EVENT, ({ sound }) =>
      sound ? rig.play(SOUND_MOVES[sound], sound === "none" ? 2.2 : 2.5) : rig.stop(),
    );
  },
  service: ({ rig, art }) => {
    const held = art !== "base";
    const t = gsap.delayedCall(0.7, () => void rig.play(held ? "propShow" : "wave"));
    rig.startIdle({ fidgets: held ? ["nod", "propShow"] : ["tap", "wave"] });
    return () => void t.kill();
  },
  hours: ({ rig }) => rig.startIdle({ fidgets: ["nod"] }),
  peek: ({ rig, box }) => peek(rig, box),
};

const load = (pose: PoseName) => {
  const img = new Image();
  img.src = POSES[pose];
  img.alt = "";
  img.draggable = false;
  img.dataset.pose = pose;
  img.className = "joe-art absolute inset-0 h-full w-full select-none";
  return img.decode().then(() => img);
};

/** A small check-engine light Joe points at. */
const warnLight = () => {
  const el = document.createElement("div");
  el.dataset.warn = "";
  el.className = "pointer-events-none absolute right-[-6%] top-[18%] w-[22%] opacity-0";
  el.innerHTML =
    '<svg viewBox="0 0 48 38" aria-hidden="true"><rect x="2" y="2" width="44" height="34" rx="8" fill="#ffb020" stroke="#0a0908" stroke-width="4"/><path d="M11 15h5v-4h10v4h5l4 4v8l-4 4h-5v3H16l-5-5H8V15z" fill="#0a0908"/></svg>';
  return el;
};

/** Stack every pose this Joe needs over the still image (same box, so no shift) and start the rig. */
export async function goLive(box: HTMLElement, art: JoeArtName, behavior: Behavior): Promise<Live> {
  const poses: PoseName[] = [art, ...posesFor(art === "base" ? USES[behavior] : [])].filter((p, i, a) => a.indexOf(p) === i);
  const imgs = await Promise.all(poses.map(load));
  const stage = document.createElement("div");
  stage.className = "pointer-events-none absolute inset-0";
  imgs.forEach((img) => (img.style.opacity = img.dataset.pose === art ? "1" : "0"));
  stage.append(...imgs, warnLight());
  const still = box.querySelector<HTMLElement>("[data-joe-still]");
  box.insertBefore(stage, still?.nextSibling ?? null);
  if (still) still.style.visibility = "hidden";

  const clickMoves = art === "sign" ? (["nod"] as MoveName[]) : art === "base" ? CLICK_MOVES : PROP_CLICKS;
  const followers = [...box.querySelectorAll<HTMLElement>("[data-sign]")];
  const rig = createRig(stage, { rest: art, clickMoves, followers });
  const off = BEHAVIORS[behavior]({ rig, box, art });

  return {
    click: () => void rig.playRandomClick(),
    hover: rig.hover,
    flip: (mid) => {
      rig.play("nod");
      gsap
        .timeline()
        .to(followers, { scaleX: 0, duration: 0.16, ease: "power2.in" })
        .call(mid)
        .to(followers, { scaleX: 1, duration: 0.28, ease: "back.out(2)" });
    },
    destroy: () => {
      off?.();
      rig.destroy();
      stage.remove();
      if (still) still.style.visibility = "";
    },
  };
}

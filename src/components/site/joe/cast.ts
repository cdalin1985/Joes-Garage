import type { Behavior, JoeArtName, QuipSide } from "./art";
import type { Rig } from "./rig";

/** Every live Joe on the page, so only one performs at a time. */
export type Member = { behavior: Behavior; rig: Rig; box: HTMLElement; art: JoeArtName; sides: QuipSide[] };
const members = new Set<Member>();
export const join = (m: Member) => (members.add(m), () => void members.delete(m));
/** The most visible resident Joe (at least half on screen), or null so the peek steps in. */
export const lead = () =>
  [...members].filter((m) => m.behavior !== "peek" && m.rig.ratio() >= 0.5).sort((a, b) => b.rig.ratio() - a.rig.ratio())[0] ?? null;
/** Any part of a resident Joe is on screen, so the peek stays down: never two of him at once. */
export const residentVisible = () => [...members].some((m) => m.behavior !== "peek" && m.rig.ratio() > 0);
export const anyBusy = () => [...members].some((m) => m.rig.busy());

/** The visitor chose "Hide Joe". */
export const joeHidden = () => document.documentElement.classList.contains("joe-hidden");
/** The shop assistant's panel is open. */
export const chatOpen = () => document.getElementById("joes-assistant") !== null;

/** Listen for one of Joe's window events; returns the unsubscribe. */
export const listen = <T>(type: string, fn: (detail: T) => void) => {
  const on = (e: Event) => fn((e as CustomEvent<T>).detail);
  window.addEventListener(type, on);
  return () => window.removeEventListener(type, on);
};

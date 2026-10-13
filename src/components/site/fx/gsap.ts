"use client";

/**
 * Single place the public site registers GSAP and its plugins, so every
 * effect component imports a ready-to-use instance. Client-only.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);

export { gsap, ScrollTrigger, SplitText, useGSAP };

/** True when the visitor has asked their OS for less motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Event fired when the garage-door intro finishes (or is skipped). */
export const DOOR_OPEN_EVENT = "joes:door-open";

/** Resolve once the intro is out of the way, or immediately if it never ran. */
export function whenDoorOpen(cb: () => void): () => void {
  if (!document.documentElement.classList.contains("fx-intro")) {
    cb();
    return () => {};
  }
  window.addEventListener(DOOR_OPEN_EVENT, cb, { once: true });
  return () => window.removeEventListener(DOOR_OPEN_EVENT, cb);
}

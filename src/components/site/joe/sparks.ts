"use client";

import { gsap } from "@/components/site/fx/gsap";
import { DUR, EASE } from "./motion";

const COLOURS = ["#ff3b3f", "#ffb02e", "#f4f4f2"];
const RAYS = 9;

/** A small spark burst at (x%, y%) of `host`: thin rays shoot out and fade. Transform/opacity only. */
export function sparks(tl: gsap.core.Timeline, host: HTMLElement, x: number, y: number, at: number): void {
  const layer = document.createElement("span");
  layer.dataset.testid = "joe-sparks";
  layer.setAttribute("aria-hidden", "true");
  layer.className = "pointer-events-none absolute inset-0";
  layer.style.zIndex = "999";
  host.append(layer);
  const w = host.offsetWidth;
  for (let i = 0; i < RAYS; i++) {
    const ray = document.createElement("i");
    ray.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:${0.07 * w}px;height:2px;border-radius:1px;transform-origin:0 50%;background:${COLOURS[i % 3]}`;
    layer.append(ray);
    // An upward fan from -160° to -20°, each ray a touch off true.
    const a = -160 + (140 * i) / (RAYS - 1) + gsap.utils.random(-6, 6);
    const [dx, dy] = [Math.cos((a * Math.PI) / 180) * w, Math.sin((a * Math.PI) / 180) * w];
    const s = at + i * 0.015;
    gsap.set(ray, { rotation: a });
    tl.fromTo(ray, { x: dx * 0.04, y: dy * 0.04, scaleX: 0 }, { x: dx * 0.12, y: dy * 0.12, scaleX: 1, duration: DUR.base, ease: EASE.out }, s);
    tl.to(ray, { opacity: 0, duration: DUR.quick, ease: EASE.in }, s + DUR.base * 0.6);
  }
  tl.call(() => layer.remove(), [], at + (RAYS - 1) * 0.015 + DUR.base * 0.6 + DUR.quick);
}

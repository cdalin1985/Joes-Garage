"use client";

import { gsap } from "@/components/site/fx/gsap";

const COLORS = ["#e3121b", "#ff3b3f", "#f4f4f2", "#ffb020", "#c7ccd3"];

/** Short brand-coloured confetti burst from (x, y) in viewport px. Transform/opacity only. */
export function confetti(x: number, y: number, count = 70) {
  const layer = document.createElement("div");
  layer.dataset.testid = "joe-confetti";
  layer.setAttribute("aria-hidden", "true");
  layer.className = "pointer-events-none fixed inset-0 z-[70] overflow-hidden";
  document.body.append(layer);

  const r = gsap.utils.random;
  const tl = gsap.timeline({ onComplete: () => layer.remove() });
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("i");
    const w = r(6, 11);
    bit.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${w * r(0.4, 1.6)}px;background:${COLORS[i % COLORS.length]};border-radius:${i % 3 ? 1 : 99}px`;
    layer.append(bit);
    const angle = r(-Math.PI * 0.95, -Math.PI * 0.05);
    const speed = r(180, 520);
    const dx = Math.cos(angle) * speed;
    const up = Math.sin(angle) * speed;
    const t = r(1.2, 1.9);
    tl.to(bit, { x: dx * 0.7, y: up, rotation: r(-360, 360), duration: t * 0.38, ease: "power2.out" }, 0);
    tl.to(bit, { x: dx, y: up + r(260, 480), rotation: `+=${r(180, 540)}`, duration: t * 0.62, ease: "power1.in" }, t * 0.38);
    tl.to(bit, { opacity: 0, duration: 0.35 }, t - 0.35);
  }
  return () => (tl.kill(), layer.remove());
}

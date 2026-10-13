"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./gsap";

/**
 * Sparks that trail the mouse and shower on click — like a grinder.
 * Mouse/trackpad only (never on touch), never under reduced motion, and the
 * real cursor is left alone so nothing gets harder to use.
 */
export function SparkCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || prefersReducedMotion() || !matchMedia("(pointer: fine)").matches) return;

    type S = { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; max: number };
    const sparks: S[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let running = false;
    let last = 0;
    let lx = -1;
    let ly = -1;

    const resize = () => {
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const emit = (x: number, y: number, n: number, speed: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.3 + Math.random());
        sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.4, life: 0, max: 0.35 + Math.random() * 0.45 });
      }
      if (sparks.length > 260) sparks.splice(0, sparks.length - 260);
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const frame = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        if (s.life >= s.max) {
          sparks.splice(i, 1);
          continue;
        }
        s.px = s.x;
        s.py = s.y;
        s.vy += 1100 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const k = 1 - s.life / s.max;
        ctx.strokeStyle = `rgba(255, ${150 + Math.round(90 * k)}, ${60 + Math.round(120 * k)}, ${k})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(s.px, s.py);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
      if (sparks.length) raf = requestAnimationFrame(frame);
      else {
        running = false;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const d = Math.hypot(e.clientX - lx, e.clientY - ly);
      if (lx < 0 || d > 14) {
        emit(e.clientX, e.clientY, d > 40 ? 3 : 1, 140);
        lx = e.clientX;
        ly = e.clientY;
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") emit(e.clientX, e.clientY, 22, 380);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[90] h-full w-full" aria-hidden="true" />;
}

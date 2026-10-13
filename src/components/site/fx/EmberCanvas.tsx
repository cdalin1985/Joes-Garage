"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { prefersReducedMotion } from "./gsap";

/**
 * Full-bleed canvas of drifting embers, plus on-demand spark showers.
 *
 * Embers rise and sway on their own and shy away from the pointer; `burst()`
 * fires a shower of hot streaks from a point (in viewport coordinates).
 * Pauses itself off-screen and in background tabs. No-op under reduced motion.
 */

export type EmberHandle = { burst: (clientX: number, clientY: number, power?: number) => void };

type Particle = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  spark: boolean;
  seed: number;
};

export const EmberCanvas = forwardRef<EmberHandle, { className?: string; density?: number }>(
  function EmberCanvas({ className = "", density = 1 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const burstRef = useRef<EmberHandle["burst"]>(() => {});

    useImperativeHandle(ref, () => ({ burst: (x, y, p) => burstRef.current(x, y, p) }));

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || prefersReducedMotion()) return;

      const parts: Particle[] = [];
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = 0;
      let h = 0;
      let rect = canvas.getBoundingClientRect();
      const pointer = { x: -9999, y: -9999 };
      let visible = true;
      let raf = 0;
      let last = performance.now();

      const resize = () => {
        rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();

      const maxEmbers = Math.round(Math.min(90, (w * h) / 16000) * density);

      const ember = (seed = false): Particle => {
        const x = Math.random() * w;
        const y = seed ? Math.random() * h : h + 10;
        return {
          x,
          y,
          px: x,
          py: y,
          vx: (Math.random() - 0.5) * 12,
          vy: -(18 + Math.random() * 42),
          life: 0,
          max: 4 + Math.random() * 6,
          size: 0.8 + Math.random() * 2.2,
          spark: false,
          seed: Math.random() * 1000,
        };
      };
      for (let i = 0; i < maxEmbers; i++) parts.push(ember(true));

      burstRef.current = (cx, cy, power = 1) => {
        rect = canvas.getBoundingClientRect();
        const x = cx - rect.left;
        const y = cy - rect.top;
        const n = Math.round(46 * power);
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7;
          const s = (160 + Math.random() * 520) * power;
          parts.push({
            x,
            y,
            px: x,
            py: y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 0,
            max: 0.5 + Math.random() * 0.9,
            size: 1 + Math.random() * 1.6,
            spark: true,
            seed: 0,
          });
        }
      };

      const onMove = (e: PointerEvent) => {
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
      };
      const onLeave = () => {
        pointer.x = pointer.y = -9999;
      };
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
      });
      io.observe(canvas);
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);

      const frame = (t: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((t - last) / 1000, 0.05);
        last = t;
        if (!visible || document.hidden) return;

        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        let embers = 0;

        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.life += dt;
          if (p.life >= p.max || p.y < -20 || p.x < -40 || p.x > w + 40 || p.y > h + 40) {
            parts.splice(i, 1);
            continue;
          }
          p.px = p.x;
          p.py = p.y;
          if (p.spark) {
            p.vy += 900 * dt; // gravity
            p.vx *= 0.985;
          } else {
            embers++;
            p.vx += Math.sin(t / 600 + p.seed) * 6 * dt; // sway
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 120 * 120) {
              const f = (1 - Math.sqrt(d2) / 120) * 260 * dt;
              p.vx += (dx / 120) * f * 4;
              p.vy += (dy / 120) * f * 4;
            }
            p.vx *= 0.99;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const k = 1 - p.life / p.max;
          if (p.spark) {
            ctx.strokeStyle = `rgba(255, ${170 + Math.round(70 * k)}, ${80 + Math.round(140 * k)}, ${k})`;
            ctx.lineWidth = p.size;
            ctx.beginPath();
            ctx.moveTo(p.px, p.py);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          } else {
            const flick = 0.65 + 0.35 * Math.sin(t / 90 + p.seed);
            const a = Math.min(1, p.life * 2) * k * flick;
            ctx.fillStyle = `rgba(255, 120, 30, ${a * 0.18})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255, 210, 140, ${a})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        for (let i = embers; i < maxEmbers; i++) parts.push(ember());
        ctx.globalCompositeOperation = "source-over";
      };
      raf = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onLeave);
        burstRef.current = () => {};
      };
    }, [density]);

    return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
  },
);

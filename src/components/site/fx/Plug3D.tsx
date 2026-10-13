"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { PlugSceneApi } from "./plug3d-scene";

export type Plug3DHandle = {
  fire: (power?: number) => void;
  gapClient: () => { x: number; y: number } | null;
  setScroll: (p: number) => void;
  setPointer: (x: number, y: number) => void;
};

/**
 * Real-time 3D chrome spark plug. Downloads three.js only when the device can
 * run WebGL and the visitor allows motion; otherwise does nothing and the 2D
 * plug underneath stays visible. Marks <html> with `fx-3d-ready` once the
 * first frame is on screen (CSS then hides the 2D plug).
 */
export const Plug3D = forwardRef<Plug3DHandle, { className?: string }>(function Plug3D({ className = "" }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<PlugSceneApi | null>(null);

  useImperativeHandle(ref, () => ({
    fire: (p) => api.current?.fire(p),
    gapClient: () => api.current?.gapClient() ?? null,
    setScroll: (p) => api.current?.setScroll(p),
    setPointer: (x, y) => api.current?.setPointer(x, y),
  }));

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("fx-3d") || !host.current) return;
    let cancelled = false;
    // The insulator label is drawn in Kanit; give the font a moment to arrive.
    const font = Promise.race([
      document.fonts?.load("italic 900 100px Kanit").catch(() => undefined),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
    Promise.all([import("./plug3d-scene"), font])
      .then(([{ createPlugScene }]) => {
        if (cancelled || !host.current) return;
        api.current = createPlugScene(host.current, () => html.classList.add("fx-3d-ready"));
      })
      .catch(() => html.classList.remove("fx-3d"));
    return () => {
      cancelled = true;
      api.current?.dispose();
      api.current = null;
      html.classList.remove("fx-3d-ready");
    };
  }, []);

  return <div ref={host} className={`plug-3d ${className}`} aria-hidden="true" />;
});

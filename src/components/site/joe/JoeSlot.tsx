"use client";

import Image from "next/image";
import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { prefersReducedMotion } from "@/components/site/fx/gsap";
import { POSES, JOE_H, JOE_W, type Behavior, type JoeArtName } from "./art";
import type { Live } from "./live";

type Props = {
  art: JoeArtName;
  behavior: Behavior;
  label: string;
  testId: string;
  className?: string;
  interactive?: boolean;
  eager?: boolean;
  /** Wait for the slot to near the viewport before loading the animation. */
  observe?: boolean;
  onActivate?: (live: Live | null) => void;
  liveRef?: MutableRefObject<Live | null>;
  children?: ReactNode;
};

/** Resolve once the tab is visible, the page has loaded and the browser is idle. */
function whenReady(el: HTMLElement, observe: boolean, cb: () => void): () => void {
  let done = false;
  const cleanups: (() => void)[] = [];
  const fire = () => !done && ((done = true), cb());
  const idle = () => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(fire, { timeout: 2000 });
      cleanups.push(() => window.cancelIdleCallback(id));
    } else {
      const id = setTimeout(fire, 300);
      cleanups.push(() => clearTimeout(id));
    }
  };
  const near = () => {
    if (!observe) return idle();
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (io.disconnect(), idle()), { rootMargin: "300px" });
    io.observe(el);
    cleanups.push(() => io.disconnect());
  };
  const loaded = () => (document.readyState === "complete" ? near() : window.addEventListener("load", near, { once: true }));
  const visible = () => {
    if (document.visibilityState === "visible") return loaded();
    const on = () => document.visibilityState === "visible" && (document.removeEventListener("visibilitychange", on), loaded());
    document.addEventListener("visibilitychange", on);
    cleanups.push(() => document.removeEventListener("visibilitychange", on));
  };
  visible();
  cleanups.push(() => window.removeEventListener("load", near));
  return () => ((done = true), cleanups.forEach((c) => c()));
}

/**
 * Joe's spot on the page. Server HTML is the still SVG in a box of fixed
 * aspect ratio, so nothing shifts. Once the page is visible and idle (and
 * motion is allowed) the animation code is imported and takes over.
 */
export function JoeSlot({ art, behavior, label, testId, className = "", interactive = true, eager, observe = true, onActivate, liveRef, children }: Props) {
  const box = useRef<HTMLElement>(null);
  const live = useRef<Live | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || prefersReducedMotion()) return;
    let cancelled = false;
    const stop = whenReady(el, observe, () => {
      import("./live")
        .then((m) => m.goLive(el, art, behavior))
        .then((l) => {
          if (cancelled) return l.destroy();
          live.current = l;
          if (liveRef) liveRef.current = l;
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
      stop();
      live.current?.destroy();
      live.current = null;
      if (liveRef) liveRef.current = null;
    };
  }, [art, behavior, observe, liveRef]);

  const still = (
    <Image
      src={POSES[art]}
      alt=""
      width={JOE_W}
      height={JOE_H}
      unoptimized
      priority={eager}
      draggable={false}
      data-joe-still
      className="joe-art h-full w-full select-none"
    />
  );
  const cls = `relative block aspect-[560/916] h-full ${className}`;

  if (!interactive)
    return (
      <div ref={box as React.RefObject<HTMLDivElement>} data-joe data-testid={testId} aria-hidden="true" className={cls}>
        {still}
        {children}
      </div>
    );

  return (
    <button
      ref={box as React.RefObject<HTMLButtonElement>}
      type="button"
      data-joe
      data-testid={testId}
      aria-label={label}
      onPointerEnter={() => live.current?.hover(true)}
      onPointerLeave={() => live.current?.hover(false)}
      onClick={() => (onActivate ? onActivate(live.current) : live.current?.click())}
      className={`${cls} pointer-events-auto cursor-pointer rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b3f]/70`}
    >
      {still}
      {children}
    </button>
  );
}

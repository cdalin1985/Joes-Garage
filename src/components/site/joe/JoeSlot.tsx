"use client";

import Image from "next/image";
import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { prefersReducedMotion } from "@/components/site/fx/gsap";
import { POSES, JOE_H, JOE_W, type Behavior, type JoeArtName } from "./art";
import { JOE_HIDDEN_EVENT, type JoeHiddenDetail } from "./events";
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
  /** Server-render the rest pose (the peek renders none until he's needed). */
  still?: boolean;
  /** Contact shadow under his boots. */
  floor?: boolean;
  onActivate?: (live: Live | null) => void;
  liveRef?: MutableRefObject<Live | null>;
  children?: ReactNode;
};

/** Resolve once the tab is visible, the page has loaded, the browser is idle and Joe isn't hidden. */
function whenReady(el: HTMLElement, observe: boolean, cb: () => void): () => void {
  let done = false;
  const cleanups: (() => void)[] = [];
  // A hidden Joe costs nothing until the visitor shows him again.
  const fire = () => {
    if (done) return;
    if (!document.documentElement.classList.contains("joe-hidden")) return void ((done = true), cb());
    const on = (e: Event) => (e as CustomEvent<JoeHiddenDetail>).detail.hidden || (window.removeEventListener(JOE_HIDDEN_EVENT, on), (done = true), cb());
    window.addEventListener(JOE_HIDDEN_EVENT, on);
    cleanups.push(() => window.removeEventListener(JOE_HIDDEN_EVENT, on));
  };
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
 * Joe's spot on the page. Server HTML is his still photo, layered in a box of
 * fixed aspect ratio (floor, stage, idle layer), so nothing shifts. Once the
 * page is visible and idle (and motion is allowed) the animation code is
 * imported and takes over; turning on reduced motion mid-visit hands back
 * the still.
 */
export function JoeSlot({
  art,
  behavior,
  label,
  testId,
  className = "",
  interactive = true,
  eager,
  observe = true,
  still = true,
  floor = true,
  onActivate,
  liveRef,
  children,
}: Props) {
  const box = useRef<HTMLElement>(null);
  const live = useRef<Live | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || prefersReducedMotion()) return;
    let cancelled = false;
    const stop = whenReady(el, observe, () => {
      import("./live")
        .then((m) => {
          if (cancelled) return;
          live.current = m.goLive(el, art, behavior);
          if (liveRef) liveRef.current = live.current;
        })
        .catch(() => {});
    });
    const end = () => {
      cancelled = true;
      stop();
      live.current?.destroy();
      live.current = null;
      if (liveRef) liveRef.current = null;
    };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => motion.matches && end();
    motion.addEventListener("change", onMotion);
    return () => (motion.removeEventListener("change", onMotion), end());
  }, [art, behavior, observe, liveRef]);

  const layers = (
    <>
      {floor && (
        <span
          data-joe-floor
          data-testid="joe-floor"
          aria-hidden="true"
          className="joe-floor pointer-events-none absolute bottom-[-1.5%] left-[12%] h-[6%] w-[80%]"
        />
      )}
      <span data-joe-stage className="absolute inset-0">
        <span data-joe-idle className="absolute inset-0">
          {still && (
            <Image
              src={POSES[art]}
              alt=""
              width={JOE_W}
              height={JOE_H}
              unoptimized
              priority={eager}
              draggable={false}
              data-joe-still
              data-pose={art}
              className="joe-art absolute inset-0 h-full w-full select-none"
            />
          )}
          {children}
        </span>
      </span>
    </>
  );
  const cls = `relative block aspect-[560/916] h-full ${className}`;

  if (!interactive)
    return (
      <div ref={box as React.RefObject<HTMLDivElement>} data-joe data-testid={testId} aria-hidden="true" className={cls}>
        {layers}
      </div>
    );

  // The button itself lets clicks through its transparent margins; only his body (the hit span) takes the pointer.
  return (
    <button
      ref={box as React.RefObject<HTMLButtonElement>}
      type="button"
      data-joe
      data-testid={testId}
      aria-label={label}
      onPointerEnter={() => live.current?.hover(true)}
      onPointerLeave={() => live.current?.hover(false)}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && live.current?.hover(true)}
      onBlur={() => live.current?.hover(false)}
      onClick={() => (onActivate ? onActivate(live.current) : live.current?.click())}
      className={`${cls} pointer-events-none rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b3f]/70`}
    >
      {layers}
      <span data-joe-hit aria-hidden="true" className="pointer-events-auto absolute inset-x-[18%] bottom-0 top-[5%] cursor-pointer" />
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered reveals, done with a single IntersectionObserver instead of
 * an animation library — the marketing pages stay statically generated and the
 * JavaScript cost stays near zero, which matters because page speed feeds
 * search ranking.
 *
 * Visitors with "reduce motion" turned on skip straight to the final state.
 */

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Honour the system setting: show everything immediately, animate nothing.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect(); // one-shot: never re-hide content
        }
      },
      // Threshold 0: a tall group (a stacked card list on a phone) can never be
      // 12% visible at once, which used to leave it blank until scrolled.
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView };
}

/** Fades and lifts a single block into place. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** Staggers its direct children — one observer for a whole grid or list. */
export function RevealGroup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal-group ${inView ? "is-in" : ""} ${className}`}>
      {children}
    </div>
  );
}

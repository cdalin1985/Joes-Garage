"use client";

import { useEffect, useRef, useState } from "react";
import { shopStatus } from "@/components/site/fx/NeonSign";
import { JoeSlot } from "./JoeSlot";
import type { Live } from "./live";

type Day = { day: string; open: string; close: string; closed: boolean };
type Line = { days: string; hours: string };

/** What's painted on the sign: live OPEN/CLOSED on the front, weekly hours on the back. */
function SignFace({ side, open, lines }: { side: "front" | "back"; open: boolean | null; lines: Line[] }) {
  const color = open === null ? "#6b6560" : open ? "#ff3b2f" : "#3d7bff";
  return (
    <div
      data-sign
      className="pointer-events-none absolute left-[20%] top-[30.5%] flex h-[22.5%] w-[60%] flex-col items-center justify-center px-[5%] [container-type:inline-size]"
      style={{ transformOrigin: "50% 308.9%" }}
    >
      {side === "front" ? (
        <span
          data-testid="hours-joe-sign-front"
          className="font-black leading-none tracking-wide"
          style={{ color, fontSize: open === false ? "19cqw" : "26cqw", textShadow: open === null ? undefined : `0 0 6px ${color}` }}
        >
          {open === false ? "CLOSED" : "OPEN"}
        </span>
      ) : (
        <span data-testid="hours-joe-sign-back" className="flex flex-col items-center gap-[2cqw] text-center leading-tight">
          {lines.slice(0, 2).map((l) => (
            <span key={l.days} className="block">
              <span className="block font-black uppercase text-[#ff8a8d]" style={{ fontSize: "11.5cqw" }}>
                {l.days}
              </span>
              <span className="block font-bold text-[#f4f4f2]" style={{ fontSize: "12.5cqw" }}>
                {l.hours.replace(/:00/g, "")}
              </span>
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

/**
 * "Joe says": Joe holds a two-sided shop sign. It flips every few seconds
 * while on screen, and tapping him flips it right away (with reduced motion
 * the sides just swap).
 */
export function HoursJoe({ hours, timeZone, lines }: { hours: Day[]; timeZone: string; lines: Line[] }) {
  const [state, setState] = useState<{ open: boolean; line: string } | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const liveRef = useRef<Live | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const lastFlip = useRef(0);

  useEffect(() => {
    const tick = () => setState(shopStatus(hours, timeZone));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours, timeZone]);

  const toggle = () => setSide((s) => (s === "front" ? "back" : "front"));
  const flip = (live: Live | null) => {
    lastFlip.current = Date.now();
    if (live) live.flip(toggle);
    else toggle();
  };

  useEffect(() => {
    let inView = false;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting));
    if (card.current) io.observe(card.current);
    const id = setInterval(() => {
      if (liveRef.current && inView && Date.now() - lastFlip.current > 5500) flip(liveRef.current);
    }, 1000);
    return () => (clearInterval(id), io.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={card} className="mb-6 flex items-end gap-5 rounded-2xl border border-white/10 bg-[#12100e] p-5 pb-3" data-testid="hours-joe">
      <div className="h-64 shrink-0 sm:h-80">
        <JoeSlot
          art="sign"
          behavior="hours"
          testId="hours-joe-button"
          label="Joe holding the shop's open or closed sign — tap to flip it"
          liveRef={liveRef}
          onActivate={flip}
        >
          <SignFace side={side} open={state ? state.open : null} lines={lines} />
        </JoeSlot>
      </div>
      <div className="pb-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a8d]">Joe says</p>
        <p className="mt-1 font-display text-2xl font-extrabold leading-tight text-white" data-testid="hours-joe-status" aria-live="polite">
          {state ? (state.open ? "We're open — come on by" : "We're closed right now") : "Shop hours"}
        </p>
        <p className="mt-1 text-sm text-white/60" data-testid="hours-joe-line">
          {state?.line ?? lines.map((l) => `${l.days} ${l.hours}`).join(" · ")}
        </p>
        <p data-joe-hint className="mt-2 text-xs text-white/40" data-testid="hours-joe-side">
          {side === "front" ? "Tap Joe to see the hours" : "Tap Joe to flip it back"}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { shopStatus } from "@/components/site/fx/NeonSign";
import { JoeSlot } from "./JoeSlot";
import type { Live } from "./live";

type Day = { day: string; open: string; close: string; closed: boolean };
type Line = { days: string; hours: string };

/** What's painted on the sign: live OPEN/CLOSED on the front, weekly hours on the reverse. */
function SignFace({ side, open, lines }: { side: "front" | "back"; open: boolean | null; lines: Line[] }) {
  const color = open === null ? "#6b6560" : open ? "#ff3b2f" : "#3d7bff";
  return (
    <div
      data-sign
      className="pointer-events-none absolute left-[20%] top-[30.5%] z-10 h-[22.5%] w-[60%] px-[5%] [container-type:inline-size]"
    >
      <div data-sign-face className="flex h-full w-full flex-col items-center justify-center">
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
    </div>
  );
}

/**
 * "Joe says": Joe holds a two-sided shop sign. Shortly after the card comes
 * into view it flaps over to the hours, then back to the live status, and
 * stays there; tapping him flips it any time (with reduced motion the sides
 * just swap, and it never flips by itself).
 */
export function HoursJoe({ hours, timeZone, lines }: { hours: Day[]; timeZone: string; lines: Line[] }) {
  const [state, setState] = useState<{ open: boolean; line: string } | null>(null);
  const [side, setSide] = useState<"front" | "back">("front");
  const sideRef = useRef<"front" | "back">("front");
  const liveRef = useRef<Live | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const lastManual = useRef(0);

  useEffect(() => {
    const tick = () => setState(shopStatus(hours, timeZone));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours, timeZone]);

  const toggle = () => {
    sideRef.current = sideRef.current === "front" ? "back" : "front";
    setSide(sideRef.current);
  };
  const flip = (live: Live | null, manual = false) => {
    if (manual) lastManual.current = Date.now();
    if (live) live.flip(toggle, manual);
    else toggle();
  };

  // Two automatic flips, the first time the card is half on screen: to the hours, then to the live status again.
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const timers: number[] = [];
    const auto = (from: "front" | "back") => () => {
      const live = liveRef.current;
      const hidden = document.documentElement.classList.contains("joe-hidden");
      if (live && !hidden && sideRef.current === from && Date.now() - lastManual.current > 4000) flip(live);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio < 0.5) return;
        io.disconnect();
        timers.push(window.setTimeout(auto("front"), 2500), window.setTimeout(auto("back"), 9500));
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => (io.disconnect(), timers.forEach(clearTimeout));
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
          onActivate={(live) => flip(live, true)}
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
        <p data-joe-hint className="mt-2 text-xs text-white/60" data-testid="hours-joe-side">
          {side === "front" ? "Tap Joe to see the hours" : "Tap Joe to flip it back"}
        </p>
      </div>
    </div>
  );
}

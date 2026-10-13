"use client";

import { useEffect, useState } from "react";

type Day = { day: string; open: string; close: string; closed: boolean };

const ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const pretty = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
};

/** Current weekday + minutes past midnight at the shop, wherever the visitor is. */
function shopNow(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { dayIdx: ORDER.indexOf(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function status(hours: Day[], timeZone: string) {
  const byName = new Map(hours.map((h) => [h.day, h]));
  const { dayIdx, minutes } = shopNow(timeZone);
  const today = byName.get(ORDER[dayIdx]);
  if (today && !today.closed && minutes >= toMin(today.open) && minutes < toMin(today.close)) {
    return { open: true, line: `Open now · until ${pretty(today.close)} today` };
  }
  for (let i = 0; i < 7; i++) {
    const idx = (dayIdx + i) % 7;
    const d = byName.get(ORDER[idx]);
    if (!d || d.closed) continue;
    if (i === 0 && minutes >= toMin(d.open)) continue;
    const when = i === 0 ? "today" : i === 1 ? "tomorrow" : ORDER[idx];
    return { open: false, line: `Closed now · opens ${when} at ${pretty(d.open)}` };
  }
  return { open: false, line: "Call for hours" };
}

/**
 * A neon shop sign that's actually right: lit red OPEN during shop hours,
 * blue CLOSED otherwise, computed in the shop's time zone. Server HTML shows
 * an unlit sign (the time isn't known until the browser runs).
 */
export function NeonSign({ hours, timeZone }: { hours: Day[]; timeZone: string }) {
  const [state, setState] = useState<{ open: boolean; line: string } | null>(null);

  useEffect(() => {
    const tick = () => setState(status(hours, timeZone));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours, timeZone]);

  const lit = state !== null;
  const color = state?.open ? "#ff3b2f" : "#3d7bff";
  const style = { "--neon": color } as React.CSSProperties;

  return (
    <div className="flex flex-col items-start gap-4">
      <div className={`neon-tube px-7 py-3 sm:px-9 sm:py-4 ${lit ? "" : "is-off"}`} style={style}>
        <span
          className={`neon block text-6xl leading-none tracking-[0.12em] sm:text-7xl ${lit ? "neon-flicker" : "is-off"}`}
          style={style}
        >
          {state && !state.open ? "Closed" : "Open"}
        </span>
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70" aria-live="polite">
        {state?.line ?? "Shop hours"}
      </p>
    </div>
  );
}

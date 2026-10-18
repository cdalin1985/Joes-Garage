/**
 * Online appointment requests for the website assistant.
 *
 * Open drop-off times come from the shop's hours (site-config) minus requests
 * already holding a slot in the `booking_requests` table (Neon; schema in
 * db/neon/001_booking_requests.sql). A new request is saved as "requested"
 * for Joe to confirm on the /requests page. Server-only.
 */

import { site } from "@/lib/site-config";
import { isUniqueViolation, type Query } from "@/lib/db";

/** «REVIEW» with Joe: how online requests are slotted (one car per slot). */
export const booking = {
  /** Length of one drop-off slot; slots start on the hour from opening time. */
  slotMinutes: 60,
  /** How far ahead customers can request. */
  maxDaysAhead: 30,
  /** No requests for slots starting sooner than this — call instead. */
  minLeadMinutes: 120,
  /** Spam guards: web requests per phone per day, and shop-wide per hour. */
  maxPerPhonePerDay: 2,
  maxPerHour: 12,
};

/** Request statuses that hold a slot. */
const ACTIVE = "('requested', 'confirmed')";
const TZ = site.timeZone;
const DAY_MS = 86_400_000;

// ── Time zone helpers (shop-local wall clock <-> UTC) ─────────────────────

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  weekday: "long",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Shop-local calendar parts for an instant. */
export function shopParts(t: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(t).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    weekday: p.weekday as string,
    offsetMs:
      Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(t.getTime() / 1000) * 1000,
  };
}

/** UTC instant for a shop-local "YYYY-MM-DD" + "HH:MM". */
export function shopTimeToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - shopParts(new Date(guess)).offsetMs;
  t = guess - shopParts(new Date(t)).offsetMs; // settle across a DST change
  return new Date(t);
}

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10);
}

function weekdayOf(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

/** "9:00 AM" */
export function prettySlot(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "Thursday, Oct 15 at 9:00 AM" */
export function prettyWhen(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${day} at ${prettySlot(time)}`;
}

/** Shop-local "Thursday, Oct 15 at 9:00 AM" for a stored instant. */
export function prettyInstant(t: Date): string {
  const p = shopParts(t);
  return prettyWhen(p.date, p.time);
}

/** Short reference code shown to the customer and on the requests page. */
export const refOf = (id: string) => id.replace(/-/g, "").slice(0, 8).toUpperCase();

/** Slot start times ("HH:MM") the shop's hours allow on a given date. */
function slotsForDate(date: string): string[] {
  const day = site.hours.find((h) => h.day === weekdayOf(date));
  if (!day || day.closed || !day.open || !day.close) return [];
  const out: string[] = [];
  for (let t = toMin(day.open); t + booking.slotMinutes <= toMin(day.close); t += booking.slotMinutes) {
    out.push(fromMin(t));
  }
  return out;
}

/** "Wednesday, 2026-10-14, 10:31 PM shop time (America/Denver)" — for the assistant. */
export function nowForAssistant(now = new Date()): string {
  const p = shopParts(now);
  return `${p.weekday}, ${p.date}, ${prettySlot(p.time)} shop time (${TZ})`;
}

// ── Availability ─────────────────────────────────────────────────────────

export type OpenDay = { date: string; weekday: string; times: { time: string; label: string }[] };

/**
 * Open drop-off slots from `startDate` for `days` days (max 7), skipping
 * closed days, slots too soon to book, and slots an active request holds.
 */
export async function findOpenSlots(db: Query, startDate: string, days: number): Promise<OpenDay[]> {
  const now = new Date();
  const today = shopParts(now).date;
  const lastDate = addDays(today, booking.maxDaysAhead);
  const first = startDate < today ? today : startDate;
  const span = Math.max(1, Math.min(7, days));
  const dates: string[] = [];
  for (let i = 0; i < span; i++) {
    const d = addDays(first, i);
    if (d <= lastDate) dates.push(d);
  }
  if (!dates.length) return [];

  const rangeStart = shopTimeToUtc(dates[0], "00:00");
  const rangeEnd = shopTimeToUtc(addDays(dates[dates.length - 1], 1), "00:00");
  const rows = await db(
    `select start_time, end_time from booking_requests
      where status in ${ACTIVE} and start_time < $2 and end_time > $1`,
    [rangeStart.toISOString(), rangeEnd.toISOString()],
  );
  const busy = rows.map((r) => [new Date(r.start_time as string).getTime(), new Date(r.end_time as string).getTime()]);
  const slotMs = booking.slotMinutes * 60_000;
  const earliest = now.getTime() + booking.minLeadMinutes * 60_000;

  return dates.map((date) => ({
    date,
    weekday: weekdayOf(date),
    times: slotsForDate(date)
      .filter((time) => {
        const s = shopTimeToUtc(date, time).getTime();
        return s >= earliest && !busy.some(([bs, be]) => bs < s + slotMs && be > s);
      })
      .map((time) => ({ time, label: prettySlot(time) })),
  }));
}

// ── Saving a request ─────────────────────────────────────────────────────

export type RequestInput = {
  name: string;
  phone: string; // 10 digits
  email: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  concern: string;
  date: string; // YYYY-MM-DD shop-local
  time: string; // HH:MM shop-local
  notes: string;
};

export type RequestResult =
  | { ok: true; ref: string; when: string; date: string; time: string }
  | { ok: false; reason: "slot_taken" | "too_many" | "invalid_slot"; message: string };

const SLOT_TAKEN = { ok: false, reason: "slot_taken", message: "That time is no longer open. Check availability again." } as const;

/** Re-checks the slot, applies spam limits, then saves the request. */
export async function createWebRequest(db: Query, input: RequestInput): Promise<RequestResult> {
  if (!slotsForDate(input.date).includes(input.time)) {
    return { ok: false, reason: "invalid_slot", message: "That time isn't one of the shop's drop-off slots." };
  }
  const open = await findOpenSlots(db, input.date, 1);
  if (open[0]?.date !== input.date || !open[0].times.some((t) => t.time === input.time)) return SLOT_TAKEN;

  const [{ last_hour, same_phone }] = await db(
    `select
       count(*) filter (where created_at > now() - interval '1 hour')::int as last_hour,
       count(*) filter (where phone = $1 and created_at > now() - interval '1 day')::int as same_phone
     from booking_requests
     where created_at > now() - interval '1 day'`,
    [input.phone],
  );
  if (Number(last_hour) >= booking.maxPerHour || Number(same_phone) >= booking.maxPerPhonePerDay) {
    return { ok: false, reason: "too_many", message: "Too many online requests right now — please call the shop." };
  }

  const vehicle = [input.vehicleYear, input.vehicleMake, input.vehicleModel].filter(Boolean).join(" ");
  const start = shopTimeToUtc(input.date, input.time);
  const end = new Date(start.getTime() + booking.slotMinutes * 60_000);
  let id: string;
  try {
    const [row] = await db(
      `insert into booking_requests (start_time, end_time, name, phone, email, vehicle, concern, notes)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [start.toISOString(), end.toISOString(), input.name, input.phone, input.email || null, vehicle || null, input.concern, input.notes || null],
    );
    id = String(row.id);
  } catch (err) {
    // Someone else took the slot between the check and the insert.
    if (isUniqueViolation(err)) return SLOT_TAKEN;
    throw err;
  }

  return { ok: true, ref: refOf(id), when: prettyWhen(input.date, input.time), date: input.date, time: input.time };
}

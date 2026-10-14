/**
 * Online appointment requests for the website assistant.
 *
 * Open drop-off times come from the shop's hours (site-config) minus what's
 * already in the staff app's Appointment Book. A request is saved there as an
 * unconfirmed ("scheduled") appointment titled "Web request — …" for Joe to
 * confirm with the customer. Server-only: uses the service-role client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { site } from "@/lib/site-config";

/** «REVIEW» with Joe: how online requests are slotted. */
export const booking = {
  /** Length of one drop-off slot; slots start on the hour from opening time. */
  slotMinutes: 60,
  /** Cars that can be booked into the same slot. */
  perSlot: 1,
  /** How far ahead customers can request. */
  maxDaysAhead: 30,
  /** No requests for slots starting sooner than this — call instead. */
  minLeadMinutes: 120,
  /** Spam guards: web requests per phone per day, and shop-wide per hour. */
  maxPerPhonePerDay: 2,
  maxPerHour: 12,
};

export const WEB_REQUEST_TITLE = "Web request";
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

/** "It is Wednesday, 2026-10-14, 10:31 PM in Helena." — for the assistant. */
export function nowForAssistant(now = new Date()): string {
  const p = shopParts(now);
  return `${p.weekday}, ${p.date}, ${prettySlot(p.time)} shop time (${TZ})`;
}

// ── Availability ─────────────────────────────────────────────────────────

export type OpenDay = { date: string; weekday: string; times: { time: string; label: string }[] };

/**
 * Open drop-off slots from `startDate` for `days` days (max 7), skipping
 * closed days, slots too soon to book, and slots the Appointment Book already
 * fills (anything not cancelled / no-show that overlaps the slot counts).
 */
export async function findOpenSlots(db: SupabaseClient, startDate: string, days: number): Promise<OpenDay[]> {
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
  const { data, error } = await db
    .from("appointments")
    .select("start_time, end_time, status")
    .lt("start_time", rangeEnd.toISOString())
    .gte("start_time", new Date(rangeStart.getTime() - DAY_MS).toISOString())
    .not("status", "in", "(cancelled,no_show)");
  if (error) throw new Error(`appointments lookup failed: ${error.message}`);

  const slotMs = booking.slotMinutes * 60_000;
  const busy = (data ?? []).map((a) => {
    const s = new Date(a.start_time).getTime();
    const e = a.end_time ? new Date(a.end_time).getTime() : s + slotMs;
    return [s, Math.max(e, s + 1)] as const;
  });
  const earliest = now.getTime() + booking.minLeadMinutes * 60_000;

  return dates.map((date) => ({
    date,
    weekday: weekdayOf(date),
    times: slotsForDate(date)
      .filter((time) => {
        const s = shopTimeToUtc(date, time).getTime();
        if (s < earliest) return false;
        const taken = busy.filter(([bs, be]) => bs < s + slotMs && be > s).length;
        return taken < booking.perSlot;
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

const digits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "").slice(-10);
const prettyPhone = (d: string) => `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;

/** Re-checks the slot, applies spam limits, then writes customer + vehicle + appointment. */
export async function createWebRequest(db: SupabaseClient, input: RequestInput): Promise<RequestResult> {
  if (!slotsForDate(input.date).includes(input.time)) {
    return { ok: false, reason: "invalid_slot", message: "That time isn't one of the shop's drop-off slots." };
  }
  const open = await findOpenSlots(db, input.date, 1);
  if (open[0]?.date !== input.date || !open[0].times.some((t) => t.time === input.time)) {
    return { ok: false, reason: "slot_taken", message: "That time is no longer open. Check availability again." };
  }

  const phone = prettyPhone(input.phone);
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const dayAgo = new Date(Date.now() - DAY_MS).toISOString();
  const [{ count: lastHour }, { count: samePhone }] = await Promise.all([
    db.from("appointments").select("id", { count: "exact", head: true }).like("title", `${WEB_REQUEST_TITLE}%`).gte("created_at", hourAgo),
    db
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .like("title", `${WEB_REQUEST_TITLE}%`)
      .like("description", `%${phone}%`)
      .gte("created_at", dayAgo),
  ]);
  if ((lastHour ?? 0) >= booking.maxPerHour || (samePhone ?? 0) >= booking.maxPerPhonePerDay) {
    return { ok: false, reason: "too_many", message: "Too many online requests right now — please call the shop." };
  }

  // Reuse an existing customer with this phone number, but never edit them.
  const last4 = input.phone.slice(-4);
  const { data: candidates } = await db
    .from("customers")
    .select("id, phone, mobile")
    .or(`phone.ilike.%${last4}%,mobile.ilike.%${last4}%`)
    .limit(50);
  const existing = (candidates ?? []).find((c) => digits(c.phone) === input.phone || digits(c.mobile) === input.phone);

  let customerId = existing?.id as string | undefined;
  if (!customerId) {
    const [first, ...rest] = input.name.trim().split(/\s+/);
    const { data, error } = await db
      .from("customers")
      .insert({
        first_name: first,
        last_name: rest.join(" ") || null,
        phone,
        email: input.email || null,
        notes: "Added by the website booking assistant.",
      })
      .select("id")
      .single();
    if (error) throw new Error(`customer insert failed: ${error.message}`);
    customerId = data.id as string;
  }

  let vehicleId: string | null = null;
  const year = /^\d{4}$/.test(input.vehicleYear) ? Number(input.vehicleYear) : null;
  if (input.vehicleMake || input.vehicleModel) {
    const { data, error } = await db
      .from("vehicles")
      .insert({ customer_id: customerId, year, make: input.vehicleMake || null, model: input.vehicleModel || null })
      .select("id")
      .single();
    if (!error) vehicleId = data.id as string;
  }

  const vehicle = [input.vehicleYear, input.vehicleMake, input.vehicleModel].filter(Boolean).join(" ") || "vehicle not given";
  const start = shopTimeToUtc(input.date, input.time);
  const description = [
    "Requested online through the website assistant. NOT CONFIRMED — contact the customer to confirm.",
    `Name: ${input.name}`,
    `Phone: ${phone}`,
    input.email && `Email: ${input.email}`,
    `Vehicle: ${vehicle}`,
    `Concern: ${input.concern}`,
    input.notes && `Notes: ${input.notes}`,
    existing && "Phone matched an existing customer record — double-check it's the same person.",
  ]
    .filter(Boolean)
    .join("\n");

  const { data, error } = await db
    .from("appointments")
    .insert({
      customer_id: customerId,
      vehicle_id: vehicleId,
      title: `${WEB_REQUEST_TITLE} — ${vehicle}`.slice(0, 120),
      description,
      status: "scheduled",
      start_time: start.toISOString(),
      end_time: new Date(start.getTime() + booking.slotMinutes * 60_000).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`appointment insert failed: ${error.message}`);

  return {
    ok: true,
    ref: (data.id as string).slice(0, 8).toUpperCase(),
    when: prettyWhen(input.date, input.time),
    date: input.date,
    time: input.time,
  };
}

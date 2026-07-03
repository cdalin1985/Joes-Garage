import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, SectionTitle } from "@/components/ui";
import { IconPlus, IconChevronRight, IconArrowLeft } from "@/components/icons";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteAppointment } from "@/lib/actions/appointments";
import { customerName, vehicleName } from "@/lib/display";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import type { Appointment, Customer, Vehicle, Profile } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = Appointment & { customers: Customer | null; vehicles: Vehicle | null; assigned: Profile | null };

// The bookable window shown on the time grid (matches a shop's day).
const DAY_START = 7; // 7 AM
const DAY_END = 20; // 8 PM
const HOUR_PX = 56;
const VIEWS = ["week", "day", "month", "agenda"] as const;
type View = (typeof VIEWS)[number];

// --- UTC-based date helpers (kept UTC so what was typed on the form is what shows) ---
const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
function parseAnchor(s?: string): Date {
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00Z`);
  const now = new Date();
  return new Date(`${key(now)}T00:00:00Z`);
}
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
function startOfWeek(d: Date) {
  return addDays(d, -d.getUTCDay()); // week starts Sunday
}
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtHour(h: number) {
  const ap = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ap}`;
}
function fmtTime(d: Date) {
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h} ${ap}` : `${h}:${pad(m)} ${ap}`;
}

// Assign overlapping appointments to side-by-side lanes within one day.
function layout(items: Row[]) {
  const sorted = [...items].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const laneEnds: number[] = [];
  const placed = sorted.map((a) => {
    const start = new Date(a.start_time).getTime();
    const end = a.end_time ? new Date(a.end_time).getTime() : start + 3600000;
    let lane = laneEnds.findIndex((e) => e <= start);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(end); } else laneEnds[lane] = end;
    return { a, lane };
  });
  return { placed, lanes: Math.max(laneEnds.length, 1) };
}

function blockStyle(a: Row, lane: number, lanes: number) {
  const start = new Date(a.start_time);
  const end = a.end_time ? new Date(a.end_time) : new Date(start.getTime() + 3600000);
  const startMin = Math.max((start.getUTCHours() - DAY_START) * 60 + start.getUTCMinutes(), 0);
  const endMinRaw = (end.getUTCHours() - DAY_START) * 60 + end.getUTCMinutes();
  const endMin = Math.min(endMinRaw, (DAY_END - DAY_START) * 60);
  const top = (startMin / 60) * HOUR_PX;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_PX, 26);
  const width = 100 / lanes;
  return { top: `${top}px`, height: `${height}px`, left: `${lane * width}%`, width: `calc(${width}% - 3px)` };
}

function toneClasses(a: Row) {
  // Reminders (no customer) mimic the TRACS "JOE, ATTENTION" blocks.
  if (!a.customer_id) return "border-amber-300 bg-amber-50 text-amber-900";
  switch (a.status) {
    case "in_shop": return "border-amber-300 bg-amber-50 text-amber-900";
    case "completed": return "border-emerald-300 bg-emerald-50 text-emerald-900";
    case "no_show":
    case "cancelled": return "border-slate-300 bg-slate-100 text-slate-500";
    case "confirmed": return "border-purple-300 bg-purple-50 text-purple-900";
    default: return "border-brand-300 bg-brand-50 text-brand-900";
  }
}

function AppointmentBlock({ a, style }: { a: Row; style: React.CSSProperties }) {
  return (
    <div
      className={`absolute overflow-hidden rounded-md border px-1.5 py-1 text-[11px] leading-tight shadow-sm ${toneClasses(a)}`}
      style={style}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold">{a.customer_id ? customerName(a.customers) : a.title}</span>
        <DeleteButton action={deleteAppointment.bind(null, a.id)} iconOnly className="btn-ghost -m-0.5 shrink-0 p-0.5 text-current opacity-60 hover:opacity-100" confirmText="Delete this appointment?" />
      </div>
      {a.vehicles && <p className="truncate opacity-80">{vehicleName(a.vehicles)}</p>}
      {a.description && <p className="truncate opacity-70">{a.description}</p>}
      <p className="mt-0.5 opacity-60">{fmtTime(new Date(a.start_time))}{a.assigned ? ` · ${a.assigned.full_name?.split(" ")[0] ?? ""}` : ""}</p>
    </div>
  );
}

function TimeGrid({ days, byDay }: { days: Date[]; byDay: Map<string, Row[]> }) {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
  const todayKey = key(new Date());
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <div className="min-w-[720px]">
        {/* header row */}
        <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
          <div />
          {days.map((d) => (
            <div key={key(d)} className={`border-l border-slate-100 px-2 py-2 text-center ${key(d) === todayKey ? "bg-brand-50" : ""}`}>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{DOW[d.getUTCDay()].slice(0, 3)}</div>
              <div className={`text-sm font-bold ${key(d) === todayKey ? "text-brand-700" : "text-slate-700"}`}>{d.getUTCDate()}</div>
            </div>
          ))}
        </div>
        {/* body */}
        <div className="grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
          {/* hour gutter */}
          <div className="relative" style={{ height: `${hours.length * HOUR_PX}px` }}>
            {hours.map((h, i) => (
              <div key={h} className="absolute right-1.5 -translate-y-1/2 text-[10px] text-slate-400" style={{ top: `${i * HOUR_PX}px` }}>
                {i === 0 ? "" : fmtHour(h)}
              </div>
            ))}
          </div>
          {/* day columns */}
          {days.map((d) => {
            const items = byDay.get(key(d)) ?? [];
            const { placed, lanes } = layout(items);
            return (
              <div key={key(d)} className={`relative border-l border-slate-100 ${key(d) === todayKey ? "bg-brand-50/30" : ""}`} style={{ height: `${hours.length * HOUR_PX}px` }}>
                {hours.map((h, i) => (
                  <div key={h} className="absolute inset-x-0 border-t border-slate-100" style={{ top: `${i * HOUR_PX}px` }} />
                ))}
                {placed.map(({ a, lane }) => (
                  <AppointmentBlock key={a.id} a={a} style={blockStyle(a, lane, lanes)} />
                ))}
                <Link href={`/appointments/new?date=${key(d)}`} className="absolute inset-0" aria-label="Add appointment" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthView({ anchor, byDay }: { anchor: Date; byDay: Map<string, Row[]> }) {
  const first = new Date(`${anchor.getUTCFullYear()}-${pad(anchor.getUTCMonth() + 1)}-01T00:00:00Z`);
  const gridStart = startOfWeek(first);
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, dI) => addDays(gridStart, w * 7 + dI)));
  const todayKey = key(new Date());
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <div className="grid min-w-[720px] grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {DOW.map((d) => <div key={d} className="py-2">{d.slice(0, 3)}</div>)}
      </div>
      <div className="grid min-w-[720px] grid-cols-7">
        {weeks.flat().map((d) => {
          const items = byDay.get(key(d)) ?? [];
          const inMonth = d.getUTCMonth() === anchor.getUTCMonth();
          return (
            <div key={key(d)} className={`min-h-[104px] border-b border-l border-slate-100 p-1.5 ${inMonth ? "" : "bg-slate-50/60"}`}>
              <div className="mb-1 flex items-center justify-between">
                <Link href={`/appointments?view=day&date=${key(d)}`} className={`text-xs font-semibold ${key(d) === todayKey ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white" : inMonth ? "text-slate-600" : "text-slate-300"}`}>
                  {d.getUTCDate()}
                </Link>
                <Link href={`/appointments/new?date=${key(d)}`} className="text-slate-300 hover:text-brand-600"><IconPlus className="h-3 w-3" /></Link>
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((a) => (
                  <div key={a.id} className={`truncate rounded px-1 py-0.5 text-[10px] ${toneClasses(a)}`}>
                    {fmtTime(new Date(a.start_time))} {a.customer_id ? customerName(a.customers) : a.title}
                  </div>
                ))}
                {items.length > 3 && <div className="px-1 text-[10px] text-slate-400">+{items.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({ rows }: { rows: Row[] }) {
  const groups = new Map<string, Row[]>();
  for (const a of rows) {
    const k = key(new Date(a.start_time));
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(a);
  }
  if (rows.length === 0) return <Card><p className="py-6 text-center text-sm text-slate-400">No appointments in this range.</p></Card>;
  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([k, items]) => {
        const d = new Date(`${k}T00:00:00Z`);
        return (
          <Card key={k}>
            <SectionTitle>{DOW[d.getUTCDay()]}, {MON[d.getUTCMonth()]} {d.getUTCDate()}</SectionTitle>
            <ul className="divide-y divide-slate-100">
              {items.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{a.customer_id ? customerName(a.customers) : a.title}</p>
                    <p className="truncate text-xs text-slate-400">
                      {fmtTime(new Date(a.start_time))}
                      {a.vehicles ? ` · ${vehicleName(a.vehicles)}` : ""}
                      {a.description ? ` · ${a.description}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={!a.customer_id ? "amber" : APPOINTMENT_STATUS[a.status].tone}>{!a.customer_id ? "Reminder" : APPOINTMENT_STATUS[a.status].label}</Badge>
                    <DeleteButton action={deleteAppointment.bind(null, a.id)} iconOnly className="btn-ghost p-1.5" />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

export default async function AppointmentsPage({ searchParams }: { searchParams: { view?: string; date?: string } }) {
  const supabase = createClient();
  const view: View = (VIEWS as readonly string[]).includes(searchParams.view ?? "") ? (searchParams.view as View) : "week";
  const anchor = parseAnchor(searchParams.date);

  // Compute the visible range per view.
  let rangeStart: Date;
  let rangeEnd: Date;
  let days: Date[] = [];
  if (view === "day") {
    rangeStart = anchor; rangeEnd = addDays(anchor, 1); days = [anchor];
  } else if (view === "month") {
    const first = new Date(`${anchor.getUTCFullYear()}-${pad(anchor.getUTCMonth() + 1)}-01T00:00:00Z`);
    rangeStart = startOfWeek(first); rangeEnd = addDays(rangeStart, 42);
  } else if (view === "agenda") {
    rangeStart = anchor; rangeEnd = addDays(anchor, 30);
  } else {
    rangeStart = startOfWeek(anchor); rangeEnd = addDays(rangeStart, 7);
    days = Array.from({ length: 7 }, (_, i) => addDays(rangeStart, i));
  }

  const { data } = await supabase
    .from("appointments")
    .select("*, customers(*), vehicles(*), assigned:assigned_to(*)")
    .gte("start_time", rangeStart.toISOString())
    .lt("start_time", rangeEnd.toISOString())
    .order("start_time", { ascending: true });
  const rows = (data as Row[]) ?? [];

  const byDay = new Map<string, Row[]>();
  for (const a of rows) {
    const k = key(new Date(a.start_time));
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(a);
  }

  // Navigation deltas + label per view.
  const step = view === "month" ? 0 : view === "day" ? 1 : view === "agenda" ? 30 : 7;
  const prevDate = view === "month"
    ? key(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 1)))
    : key(addDays(anchor, -step));
  const nextDate = view === "month"
    ? key(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1)))
    : key(addDays(anchor, step));

  let label: string;
  if (view === "day") label = `${DOW[anchor.getUTCDay()]}, ${MON[anchor.getUTCMonth()]} ${anchor.getUTCDate()}, ${anchor.getUTCFullYear()}`;
  else if (view === "month") label = `${["January","February","March","April","May","June","July","August","September","October","November","December"][anchor.getUTCMonth()]} ${anchor.getUTCFullYear()}`;
  else if (view === "week") {
    const wEnd = addDays(rangeStart, 6);
    label = `${MON[rangeStart.getUTCMonth()]} ${rangeStart.getUTCDate()} – ${MON[wEnd.getUTCMonth()]} ${wEnd.getUTCDate()}`;
  } else label = `Next 30 days from ${MON[anchor.getUTCMonth()]} ${anchor.getUTCDate()}`;

  const pill = (v: View, text: string) => (
    <Link href={`/appointments?view=${v}&date=${key(anchor)}`} className={`rounded-full px-3 py-1 text-sm ${view === v ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{text}</Link>
  );

  return (
    <div>
      <PageHeader
        title="Appointment Book"
        subtitle="Schedule visits by customer and vehicle — or drop a shop reminder"
        actions={
          <Link href={`/appointments/new?date=${key(anchor)}`} className="btn-primary">
            <IconPlus className="h-4 w-4" /> New appointment
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/appointments?view=${view}&date=${prevDate}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><IconArrowLeft className="h-4 w-4" /></Link>
          <Link href={`/appointments?view=${view}&date=${key(new Date())}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Today</Link>
          <Link href={`/appointments?view=${view}&date=${nextDate}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><IconChevronRight className="h-4 w-4" /></Link>
          <span className="ml-1 text-sm font-semibold text-slate-700">{label}</span>
        </div>
        <div className="flex gap-2">
          {pill("day", "Day")}
          {pill("week", "Week")}
          {pill("month", "Month")}
          {pill("agenda", "Agenda")}
        </div>
      </div>

      {view === "week" && <TimeGrid days={days} byDay={byDay} />}
      {view === "day" && <TimeGrid days={days} byDay={byDay} />}
      {view === "month" && <MonthView anchor={anchor} byDay={byDay} />}
      {view === "agenda" && <AgendaView rows={rows} />}

      <p className="mt-3 text-xs text-slate-400">Tip: click any empty spot on the grid to book that day. Leave the customer blank to log a shop reminder (shown in amber).</p>
    </div>
  );
}

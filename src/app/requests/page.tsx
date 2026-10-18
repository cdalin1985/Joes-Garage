import type { Metadata } from "next";
import { site } from "@/lib/site-config";
import { getDb, type Row } from "@/lib/db";
import { prettyInstant, refOf } from "@/lib/booking";
import { isUnlocked, pinState } from "@/lib/requests-auth";
import { lock, setStatus, unlock } from "./actions";

/**
 * Joe's list of online booking requests from the website assistant.
 * PIN-protected (BOOKING_PIN); reads and updates the Neon booking_requests table.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking requests", robots: { index: false, follow: false } };

type Req = {
  id: string;
  status: "requested" | "confirmed" | "declined" | "cancelled";
  start: Date;
  name: string;
  phone: string;
  email: string | null;
  vehicle: string | null;
  concern: string;
  notes: string | null;
  created: Date;
};

const toReq = (r: Row): Req => ({
  id: String(r.id),
  status: r.status as Req["status"],
  start: new Date(r.start_time as string),
  name: String(r.name),
  phone: String(r.phone),
  email: (r.email as string | null) ?? null,
  vehicle: (r.vehicle as string | null) ?? null,
  concern: String(r.concern),
  notes: (r.notes as string | null) ?? null,
  created: new Date(r.created_at as string),
});

const prettyPhone = (d: string) => `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;

// Plain Tailwind (this page is outside the (site) group, so fx.css isn't loaded).
const HEADING = "text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl";
const BTN = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition-colors";
const BTN_PRIMARY = `${BTN} bg-gradient-to-b from-[#ff4a4f] to-[#c20a12] text-white hover:from-[#ff5a5f]`;
const BTN_GHOST = `${BTN} border border-white/20 bg-white/[0.04] text-white hover:border-white/40`;

export default async function RequestsPage({ searchParams }: { searchParams: { e?: string } }) {
  const state = pinState();
  const db = getDb();

  if (state !== "ok" || !db) {
    return (
      <Shell>
        <h1 className={HEADING}>Booking requests</h1>
        <p className="mt-4 text-white/70">This page isn&apos;t switched on yet.</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-white/60">
          {!db && <li>Set DATABASE_URL in Vercel (the Neon connection string).</li>}
          {state === "missing" && <li>Set BOOKING_PIN in Vercel.</li>}
          {state === "too_short" && <li>BOOKING_PIN must be at least 6 characters.</li>}
        </ul>
      </Shell>
    );
  }

  if (!isUnlocked()) {
    return (
      <Shell>
        <h1 className={HEADING}>Booking requests</h1>
        <form action={unlock} className="mt-6 grid gap-3">
          <label htmlFor="pin" className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">
            PIN
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            required
            className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-lg text-white focus:border-[#ff3b3f] focus:outline-none"
          />
          {searchParams.e === "pin" && <p className="text-sm text-[#ff8a8c]">That PIN didn&apos;t match.</p>}
          <button className={`${BTN_PRIMARY} py-3 text-base`}>Open</button>
        </form>
      </Shell>
    );
  }

  const rows = (
    await db(
      `select id, status, start_time, name, phone, email, vehicle, concern, notes, created_at
         from booking_requests
        where start_time > now() - interval '2 days'
        order by start_time asc
        limit 300`,
    )
  ).map(toReq);
  const waiting = rows.filter((r) => r.status === "requested");
  const confirmed = rows.filter((r) => r.status === "confirmed");
  const closed = rows.filter((r) => r.status === "declined" || r.status === "cancelled");

  return (
    <Shell>
      <div className="flex items-center justify-between gap-4">
        <h1 className={HEADING}>Booking requests</h1>
        <form action={lock}>
          <button className="text-sm text-white/50 underline underline-offset-4 hover:text-white">Lock</button>
        </form>
      </div>
      {searchParams.e === "slot" && (
        <p className="mt-4 rounded-xl border border-[#ff3b3f]/40 bg-[#ff3b3f]/10 px-3 py-2 text-sm">
          That time already has another active request, so this one can&apos;t be re-opened.
        </p>
      )}

      <Section title={`Needs a reply (${waiting.length})`} empty="Nothing waiting.">
        {waiting.map((r) => (
          <Card key={r.id} r={r}>
            <StatusButton id={r.id} status="confirmed" label="Confirm" primary />
            <StatusButton id={r.id} status="declined" label="Decline" />
          </Card>
        ))}
      </Section>

      <Section title={`Confirmed (${confirmed.length})`} empty="No confirmed drop-offs coming up.">
        {confirmed.map((r) => (
          <Card key={r.id} r={r}>
            <StatusButton id={r.id} status="cancelled" label="Cancel" />
          </Card>
        ))}
      </Section>

      {closed.length > 0 && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm font-semibold text-white/60">Declined &amp; cancelled ({closed.length})</summary>
          <div className="mt-4 grid gap-3">
            {closed.map((r) => (
              <Card key={r.id} r={r}>
                <StatusButton id={r.id} status="requested" label="Re-open" />
              </Card>
            ))}
          </div>
        </details>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 pb-16 pt-8 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3f]">{site.name}</p>
        {children}
      </div>
    </main>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/55">{title}</h2>
      <div className="mt-4 grid gap-3">{children.length ? children : <p className="text-sm text-white/45">{empty}</p>}</div>
    </section>
  );
}

function Card({ r, children }: { r: Req; children: React.ReactNode }) {
  const when = prettyInstant(r.start);
  const first = r.name.split(/\s+/)[0];
  const confirmText = `Hi ${first}, this is ${site.name}. You're confirmed for ${when}. Reply here if anything changes.`;
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-bold">{when}</p>
        <p className="font-mono text-xs text-white/40">Ref {refOf(r.id)}</p>
      </div>
      <p className="mt-2 font-semibold">
        {r.name}
        {r.vehicle && <span className="font-normal text-white/60"> · {r.vehicle}</span>}
      </p>
      <p className="mt-1 text-white/80">{r.concern}</p>
      {r.notes && <p className="mt-1 text-sm text-white/55">Notes: {r.notes}</p>}
      <p className="mt-2 text-sm text-white/55">
        {prettyPhone(r.phone)}
        {r.email && <> · {r.email}</>}
      </p>
      <p className="mt-1 text-xs text-white/35">Requested {prettyInstant(r.created)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`tel:+1${r.phone}`} className={BTN_GHOST}>
          Call
        </a>
        <a href={`sms:+1${r.phone}?&body=${encodeURIComponent(confirmText)}`} className={BTN_GHOST}>
          Text
        </a>
        {children}
      </div>
    </article>
  );
}

function StatusButton({ id, status, label, primary }: { id: string; status: string; label: string; primary?: boolean }) {
  return (
    <form action={setStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={primary ? BTN_PRIMARY : BTN_GHOST}>{label}</button>
    </form>
  );
}

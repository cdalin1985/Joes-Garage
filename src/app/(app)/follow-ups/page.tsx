import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Stat, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { logFollowUpCall } from "@/lib/actions/communications";
import { customerName, vehicleName } from "@/lib/display";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Customer, Estimate, Invoice, Vehicle, WorkOrder } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type EstRow = Estimate & { customers: Customer | null };
type InvRow = Invoice & { customers: Customer | null };
type WoRow = WorkOrder & { customers: Customer | null; vehicles: Vehicle | null };

const DAY = 86400000;
const daysSince = (iso: string) => Math.max(Math.floor((Date.now() - new Date(iso).getTime()) / DAY), 0);

function CallForm({ customer, summary, calledAgo }: { customer: Customer | null; summary: string; calledAgo: number | null }) {
  if (!customer) return null;
  return (
    <div className="flex items-center gap-2">
      {calledAgo != null && (
        <Badge tone="green">called {calledAgo === 0 ? "today" : `${calledAgo}d ago`}</Badge>
      )}
      <form action={logFollowUpCall.bind(null, customer.id)} className="flex items-center gap-1.5">
        <input type="hidden" name="summary" value={summary} />
        <button className="btn-secondary !py-1 text-xs">Log call</button>
      </form>
    </div>
  );
}

function Phone({ customer }: { customer: Customer | null }) {
  const phone = customer?.phone || customer?.mobile;
  if (!phone) return <span className="text-xs text-slate-300">no phone on file</span>;
  return (
    <a href={`tel:${phone}`} className="text-xs font-medium text-brand-600 hover:underline">
      {phone}
    </a>
  );
}

export default async function FollowUpsPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const recentCutoff = new Date(Date.now() - 14 * DAY).toISOString();

  const [{ data: estData }, { data: invData }, { data: woData }, { data: callData }] = await Promise.all([
    supabase
      .from("estimates")
      .select("*, customers(*)")
      .eq("status", "sent")
      .order("issue_date", { ascending: true })
      .limit(50),
    supabase
      .from("invoices")
      .select("*, customers(*)")
      .gt("balance_due", 0)
      .in("status", ["sent", "partial", "overdue"])
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(50),
    supabase
      .from("work_orders")
      .select("*, customers(*), vehicles(*)")
      .in("status", ["completed", "delivered"])
      .not("recommendations", "is", null)
      .neq("recommendations", "")
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(50),
    supabase
      .from("customer_communications")
      .select("customer_id, created_at")
      .eq("type", "call")
      .eq("direction", "outbound")
      .gte("created_at", recentCutoff),
  ]);

  const estimates = (estData as EstRow[]) ?? [];
  const invoices = (invData as InvRow[]) ?? [];
  const workOrders = (woData as WoRow[]) ?? [];

  // Latest outbound call per customer within the last 14 days.
  const lastCall = new Map<string, string>();
  for (const c of (callData as { customer_id: string; created_at: string }[]) ?? []) {
    const cur = lastCall.get(c.customer_id);
    if (!cur || c.created_at > cur) lastCall.set(c.customer_id, c.created_at);
  }
  const calledAgo = (cust: Customer | null) => {
    const at = cust ? lastCall.get(cust.id) : undefined;
    return at ? daysSince(at) : null;
  };

  const estValue = estimates.reduce((s, e) => s + (e.total ?? 0), 0);
  const overdueValue = invoices.reduce((s, i) => s + (i.balance_due ?? 0), 0);
  const nothingToDo = estimates.length === 0 && invoices.length === 0 && workOrders.length === 0;

  return (
    <div>
      <PageHeader
        title="Follow-Ups"
        subtitle="Money on the table — who to call this week"
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Estimates awaiting a yes" value={formatCurrency(estValue)} tone="blue" hint={`${estimates.length} sent, not approved`} />
        <Stat label="Recommended work to sell" value={workOrders.length} tone="amber" hint="from past repair orders" />
        <Stat label="Overdue balances" value={formatCurrency(overdueValue)} tone={overdueValue > 0 ? "red" : "green"} hint={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} past due`} />
      </div>

      {nothingToDo ? (
        <EmptyState
          title="Nothing to chase"
          description="No waiting estimates, no unsold recommendations, no overdue invoices. Enjoy it — this list fills itself as the shop runs."
        />
      ) : (
        <div className="space-y-5">
          {estimates.length > 0 && (
            <Card>
              <SectionTitle>Estimates waiting on approval ({estimates.length})</SectionTitle>
              <ul className="divide-y divide-slate-100">
                {estimates.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {customerName(e.customers)}
                        <Link href={`/estimates/${e.id}`} className="ml-2 text-sm font-semibold text-brand-700 hover:underline">
                          {e.number}
                        </Link>
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(e.total)} · sent {formatDate(e.issue_date)} ({daysSince(e.issue_date)}d ago) · <Phone customer={e.customers} />
                      </p>
                    </div>
                    <CallForm
                      customer={e.customers}
                      summary={`Followed up on estimate ${e.number ?? ""} (${formatCurrency(e.total)})`}
                      calledAgo={calledAgo(e.customers)}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {workOrders.length > 0 && (
            <Card>
              <SectionTitle>Recommended work not yet sold ({workOrders.length})</SectionTitle>
              <ul className="divide-y divide-slate-100">
                {workOrders.map((w) => (
                  <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {customerName(w.customers)}
                        {w.vehicles && <span className="ml-2 text-xs text-slate-400">{vehicleName(w.vehicles)}</span>}
                        <Link href={`/work-orders/${w.id}`} className="ml-2 text-sm font-semibold text-brand-700 hover:underline">
                          {w.number}
                        </Link>
                      </p>
                      <p className="max-w-xl truncate text-xs text-slate-500">{w.recommendations}</p>
                      <p className="text-xs text-slate-400">
                        {w.completed_at ? `completed ${formatDate(w.completed_at)}` : "completed"} · <Phone customer={w.customers} />
                      </p>
                    </div>
                    <CallForm
                      customer={w.customers}
                      summary={`Followed up on recommended work from ${w.number ?? "a past visit"}: ${(w.recommendations ?? "").slice(0, 120)}`}
                      calledAgo={calledAgo(w.customers)}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {invoices.length > 0 && (
            <Card>
              <SectionTitle>Overdue invoices ({invoices.length})</SectionTitle>
              <ul className="divide-y divide-slate-100">
                {invoices.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {customerName(i.customers)}
                        <Link href={`/invoices/${i.id}`} className="ml-2 text-sm font-semibold text-brand-700 hover:underline">
                          {i.number}
                        </Link>
                      </p>
                      <p className="text-xs text-slate-400">
                        <span className="font-medium text-red-600">{formatCurrency(i.balance_due ?? 0)} due</span>
                        {i.due_date && <> · was due {formatDate(i.due_date)} ({daysSince(i.due_date)}d late)</>}
                        {" · "}
                        <Phone customer={i.customers} />
                      </p>
                    </div>
                    <CallForm
                      customer={i.customers}
                      summary={`Called about overdue invoice ${i.number ?? ""} (${formatCurrency(i.balance_due ?? 0)} outstanding)`}
                      calledAgo={calledAgo(i.customers)}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        "Log call" records an outbound call in the customer&apos;s communications log so you both can see who&apos;s been contacted.
        A green badge means someone already called within the last two weeks.
      </p>
    </div>
  );
}

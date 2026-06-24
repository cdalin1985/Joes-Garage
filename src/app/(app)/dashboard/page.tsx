import Link from "next/link";
import { requireProfile, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Stat, Badge, SectionTitle, EmptyState } from "@/components/ui";
import { IconPlus, IconWrench, IconEstimate, IconInvoice, IconUsers } from "@/components/icons";
import { customerName, vehicleName } from "@/lib/display";
import { formatCurrency, formatDate } from "@/lib/format";
import { WORK_ORDER_STATUS, INVOICE_STATUS } from "@/lib/constants";
import type { Customer, Invoice, Vehicle, WorkOrder } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const OPEN_WO = ["intake", "scheduled", "in_progress", "awaiting_parts", "awaiting_approval"];

export default async function DashboardPage() {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartIso = monthStart.toISOString().slice(0, 10);

  const [{ data: recentWO }, { data: openInvoices }, { count: customerCount }] = await Promise.all([
    supabase
      .from("work_orders")
      .select("*, customers(*), vehicles(*)")
      .in("status", OPEN_WO)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("invoices")
      .select("*, customers(*)")
      .in("status", ["sent", "partial", "overdue"])
      .order("issue_date", { ascending: false })
      .limit(6),
    supabase.from("customers").select("id", { count: "exact", head: true }),
  ]);

  const recentWorkOrders = (recentWO as (WorkOrder & { customers: Customer | null; vehicles: Vehicle | null })[]) ?? [];
  const unpaidInvoices = (openInvoices as (Invoice & { customers: Customer | null })[]) ?? [];
  const outstanding = unpaidInvoices.reduce((s, i) => s + (i.balance_due ?? 0), 0);

  // Admin-only finance figures (RLS blocks these for non-admins anyway).
  let incomeMonth = 0;
  let expenseMonth = 0;
  if (admin) {
    const [{ data: pays }, { data: exps }] = await Promise.all([
      supabase.from("payments").select("amount").gte("paid_at", monthStartIso),
      supabase.from("expenses").select("amount").gte("expense_date", monthStartIso),
    ]);
    incomeMonth = ((pays as { amount: number }[]) ?? []).reduce((s, p) => s + p.amount, 0);
    expenseMonth = ((exps as { amount: number }[]) ?? []).reduce((s, e) => s + e.amount, 0);
  }

  return (
    <div>
      <PageHeader
        title={`Welcome back${profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        subtitle="Here's what's happening in the shop today"
        actions={
          <Link href="/work-orders/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New work order
          </Link>
        }
      />

      {/* KPI row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {admin ? (
          <>
            <Stat label="Income this month" value={formatCurrency(incomeMonth)} tone="green" />
            <Stat label="Expenses this month" value={formatCurrency(expenseMonth)} tone="red" />
            <Stat
              label="Net this month"
              value={formatCurrency(incomeMonth - expenseMonth)}
              tone={incomeMonth - expenseMonth >= 0 ? "green" : "red"}
            />
            <Stat label="Outstanding A/R" value={formatCurrency(outstanding)} tone={outstanding > 0 ? "amber" : "slate"} />
          </>
        ) : (
          <>
            <Stat label="Open work orders" value={recentWorkOrders.length} tone="blue" />
            <Stat label="Unpaid invoices" value={unpaidInvoices.length} tone="amber" />
            <Stat label="Outstanding balance" value={formatCurrency(outstanding)} />
            <Stat label="Customers" value={customerCount ?? 0} />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <QuickLink href="/work-orders/new" icon={<IconWrench className="h-5 w-5" />} label="New work order" />
        <QuickLink href="/estimates/new" icon={<IconEstimate className="h-5 w-5" />} label="New estimate" />
        <QuickLink href="/invoices/new" icon={<IconInvoice className="h-5 w-5" />} label="New invoice" />
        <QuickLink href="/customers/new" icon={<IconUsers className="h-5 w-5" />} label="New customer" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle action={<Link href="/work-orders" className="text-xs text-brand-600 hover:underline">View all</Link>}>
            Open work orders
          </SectionTitle>
          {recentWorkOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No open work orders. 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentWorkOrders.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <Link href={`/work-orders/${w.id}`} className="font-medium text-brand-700 hover:underline">
                      {w.number}
                    </Link>
                    <p className="truncate text-xs text-slate-400">
                      {customerName(w.customers)}
                      {w.vehicles ? ` · ${vehicleName(w.vehicles)}` : ""}
                    </p>
                  </div>
                  <Badge tone={WORK_ORDER_STATUS[w.status].tone}>{WORK_ORDER_STATUS[w.status].label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle action={<Link href="/invoices" className="text-xs text-brand-600 hover:underline">View all</Link>}>
            Needs payment
          </SectionTitle>
          {unpaidInvoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">All invoices are paid. Nice!</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {unpaidInvoices.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <Link href={`/invoices/${i.id}`} className="font-medium text-brand-700 hover:underline">
                      {i.number}
                    </Link>
                    <p className="truncate text-xs text-slate-400">
                      {customerName(i.customers)} · due {formatDate(i.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge>
                    <p className="mt-0.5 text-sm font-medium text-red-600">{formatCurrency(i.balance_due)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
        {icon}
      </span>
      {label}
    </Link>
  );
}

import Link from "next/link";
import { requireProfile, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Stat, Badge, SectionTitle } from "@/components/ui";
import {
  IconPlus,
  IconWrench,
  IconEstimate,
  IconInvoice,
  IconUsers,
  IconCalculator,
  IconReport,
  IconChevronRight,
} from "@/components/icons";
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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* Hero header */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-dark-sheen shadow-lift">
        <div className="relative bg-mesh-warm px-6 py-7 sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-32 h-44 w-44 rounded-full bg-accent-500/15 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">{today}</p>
              <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-1 text-sm text-slate-300">Here&apos;s what&apos;s happening in the shop today</p>
            </div>
            <Link href="/work-orders/new" className="btn-accent shadow-lg">
              <IconPlus className="h-4 w-4" /> New work order
            </Link>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {admin ? (
          <>
            <Stat label="Income this month" value={formatCurrency(incomeMonth)} tone="green" icon={<IconInvoice className="h-5 w-5" />} />
            <Stat label="Expenses this month" value={formatCurrency(expenseMonth)} tone="red" icon={<IconCalculator className="h-5 w-5" />} />
            <Stat
              label="Net this month"
              value={formatCurrency(incomeMonth - expenseMonth)}
              tone={incomeMonth - expenseMonth >= 0 ? "green" : "red"}
              icon={<IconReport className="h-5 w-5" />}
            />
            <Stat label="Outstanding A/R" value={formatCurrency(outstanding)} tone={outstanding > 0 ? "amber" : "slate"} icon={<IconEstimate className="h-5 w-5" />} />
          </>
        ) : (
          <>
            <Stat label="Open work orders" value={recentWorkOrders.length} tone="blue" icon={<IconWrench className="h-5 w-5" />} />
            <Stat label="Unpaid invoices" value={unpaidInvoices.length} tone="amber" icon={<IconInvoice className="h-5 w-5" />} />
            <Stat label="Outstanding balance" value={formatCurrency(outstanding)} icon={<IconEstimate className="h-5 w-5" />} />
            <Stat label="Customers" value={customerCount ?? 0} icon={<IconUsers className="h-5 w-5" />} />
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
      className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
    >
      <span className="icon-chip h-9 w-9 transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>
      {label}
      <IconChevronRight className="ml-auto h-4 w-4 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-500" />
    </Link>
  );
}

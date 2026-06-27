import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, EmptyState, SectionTitle } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { IconPlus, IconCar } from "@/components/icons";
import { customerName } from "@/lib/display";
import { vehicleName, vehicleSubtitle } from "@/lib/display";
import { formatCurrency, formatDate } from "@/lib/format";
import { INVOICE_STATUS, ESTIMATE_STATUS, WORK_ORDER_STATUS, COMMUNICATION_TYPES } from "@/lib/constants";
import { deleteCustomer } from "@/lib/actions/customers";
import { logCommunication, deleteCommunication } from "@/lib/actions/communications";
import { formatDateTime } from "@/lib/format";
import type { Customer, Vehicle, Invoice, Estimate, WorkOrder, CustomerCommunication } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const id = params.id;

  const [{ data: customer }, { data: vehicles }, { data: invoices }, { data: estimates }, { data: workOrders }, { data: comms }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("vehicles").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("customer_id", id).order("issue_date", { ascending: false }),
      supabase.from("estimates").select("*").eq("customer_id", id).order("issue_date", { ascending: false }),
      supabase.from("work_orders").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      supabase
        .from("customer_communications")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  if (!customer) notFound();
  const c = customer as Customer;
  const vs = (vehicles as Vehicle[]) ?? [];
  const invs = (invoices as Invoice[]) ?? [];
  const ests = (estimates as Estimate[]) ?? [];
  const wos = (workOrders as WorkOrder[]) ?? [];
  const communications = (comms as CustomerCommunication[]) ?? [];

  const paidInvoices = invs.filter((i) => i.status !== "void");
  const lifetimeValue = paidInvoices.reduce((sum, i) => sum + (i.amount_paid ?? 0), 0);
  const openBalance = invs.reduce((sum, i) => sum + (i.balance_due ?? 0), 0);
  const avgInvoice = paidInvoices.length > 0 ? lifetimeValue / paidInvoices.length : 0;
  const lastVisit = [...invs, ...wos]
    .map((r) => ("issue_date" in r ? r.issue_date : r.created_at))
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div>
      <PageHeader
        title={customerName(c)}
        subtitle={[c.company, c.email, c.phone].filter(Boolean).join(" · ")}
        backHref="/customers"
        actions={
          <>
            <Link href={`/estimates/new?customer=${id}`} className="btn-secondary">
              New estimate
            </Link>
            <Link href={`/work-orders/new?customer=${id}`} className="btn-secondary">
              New work order
            </Link>
            <Link href={`/customers/${id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <DeleteButton action={deleteCustomer.bind(null, id)} iconOnly confirmText="Delete this customer and all their vehicles?" />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <Card>
            <SectionTitle>Contact</SectionTitle>
            <dl className="space-y-2 text-sm">
              <Row label="Type" value={<span className="capitalize">{c.customer_type}</span>} />
              <Row label="Phone" value={c.phone || "—"} />
              <Row label="Mobile" value={c.mobile || "—"} />
              <Row label="Email" value={c.email || "—"} />
              <Row
                label="Address"
                value={
                  [c.address_line1, [c.city, c.state].filter(Boolean).join(", "), c.postal_code]
                    .filter(Boolean)
                    .join(" ") || "—"
                }
              />
              <Row label="Tax exempt" value={c.tax_exempt ? "Yes" : "No"} />
            </dl>
            {c.notes && <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">{c.notes}</p>}
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <p className="text-xs uppercase text-slate-500">Lifetime paid</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(lifetimeValue)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-slate-500">Open balance</p>
              <p className={`mt-1 text-xl font-bold ${openBalance > 0 ? "text-red-600" : "text-slate-900"}`}>
                {formatCurrency(openBalance)}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-slate-500">Avg. invoice</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(avgInvoice)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase text-slate-500">Last visit</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{lastVisit ? formatDate(lastVisit) : "—"}</p>
            </Card>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <SectionTitle
              action={
                <Link href={`/customers/${id}/vehicles/new`} className="btn-secondary !py-1 text-xs">
                  <IconPlus className="h-3.5 w-3.5" /> Add vehicle
                </Link>
              }
            >
              Vehicles ({vs.length})
            </SectionTitle>
            {vs.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No vehicles on file.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {vs.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-3">
                    <Link href={`/vehicles/${v.id}`} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <IconCar className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-medium text-slate-800">{vehicleName(v)}</span>
                        <span className="block text-xs text-slate-400">{vehicleSubtitle(v) || "—"}</span>
                      </span>
                    </Link>
                    <span className="text-sm text-slate-500">
                      {v.mileage ? `${v.mileage.toLocaleString()} mi` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>Invoices ({invs.length})</SectionTitle>
            {invs.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">No invoices yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {invs.slice(0, 8).map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link href={`/invoices/${i.id}`} className="font-medium text-brand-700 hover:underline">
                      {i.number}
                    </Link>
                    <span className="text-slate-500">{formatDate(i.issue_date)}</span>
                    <Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge>
                    <span className="w-24 text-right font-medium">{formatCurrency(i.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <SectionTitle>Estimates ({ests.length})</SectionTitle>
              {ests.length === 0 ? (
                <p className="py-3 text-center text-sm text-slate-400">None</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {ests.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                      <Link href={`/estimates/${e.id}`} className="text-brand-700 hover:underline">
                        {e.number}
                      </Link>
                      <Badge tone={ESTIMATE_STATUS[e.status].tone}>{ESTIMATE_STATUS[e.status].label}</Badge>
                      <span className="font-medium">{formatCurrency(e.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <SectionTitle>Work Orders ({wos.length})</SectionTitle>
              {wos.length === 0 ? (
                <p className="py-3 text-center text-sm text-slate-400">None</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {wos.slice(0, 5).map((w) => (
                    <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                      <Link href={`/work-orders/${w.id}`} className="text-brand-700 hover:underline">
                        {w.number}
                      </Link>
                      <Badge tone={WORK_ORDER_STATUS[w.status].tone}>{WORK_ORDER_STATUS[w.status].label}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <SectionTitle>Communications log</SectionTitle>
            <form action={logCommunication.bind(null, id)} className="mb-4 grid gap-2 sm:grid-cols-[auto_auto_1fr_auto]">
              <select name="type" defaultValue="call" className="input !py-1.5 text-sm">
                {Object.entries(COMMUNICATION_TYPES).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <select name="direction" defaultValue="outbound" className="input !py-1.5 text-sm">
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
              <input
                name="summary"
                placeholder="What was discussed…"
                required
                className="input !py-1.5 text-sm"
              />
              <button className="btn-secondary !py-1.5 text-xs">Log it</button>
            </form>
            {communications.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">No contact logged yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {communications.map((cm) => (
                  <li key={cm.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">{COMMUNICATION_TYPES[cm.type]}</span>
                      <span className="ml-1.5 text-xs text-slate-400">
                        {cm.direction === "inbound" ? "from customer" : "to customer"} · {formatDateTime(cm.created_at)}
                      </span>
                      <p className="mt-0.5 text-slate-600">{cm.summary}</p>
                    </div>
                    <DeleteButton
                      action={deleteCommunication.bind(null, cm.id, id)}
                      iconOnly
                      confirmText="Delete this log entry?"
                      className="btn-ghost text-slate-400"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value}</dd>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getShopSettings } from "@/lib/queries";
import { PageHeader, Card, Badge, Stat } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { customerName, vehicleName } from "@/lib/display";
import { formatCurrency, formatDate } from "@/lib/format";
import { WORK_ORDER_STATUS, LINE_ITEM_TYPES } from "@/lib/constants";
import type {
  Customer,
  Invoice,
  Profile,
  Vehicle,
  WorkOrder,
  WorkOrderItem,
} from "@/lib/database.types";

export const dynamic = "force-dynamic";

type WO = WorkOrder & {
  invoices: Invoice | null;
  assigned: Profile | null;
  work_order_items: WorkOrderItem[];
};

function Note({ label, value }: { label: string; value: string | null }) {
  if (!value?.trim()) return null;
  return (
    <p className="text-sm text-slate-600">
      <span className="font-semibold text-slate-500">{label}:</span> {value}
    </p>
  );
}

export default async function VehicleHistoryPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: vehicleData }, shop] = await Promise.all([
    supabase.from("vehicles").select("*, customers(*)").eq("id", params.id).single(),
    getShopSettings(),
  ]);
  if (!vehicleData) notFound();
  const v = vehicleData as Vehicle & { customers: Customer | null };

  const [{ data: woData }, { data: invData }] = await Promise.all([
    supabase
      .from("work_orders")
      .select("*, invoices(*), assigned:assigned_to(*), work_order_items(*)")
      .eq("vehicle_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("total, status")
      .eq("vehicle_id", params.id)
      .neq("status", "void"),
  ]);
  const visits = (woData as WO[]) ?? [];

  const lifetimeSpend = ((invData as { total: number }[]) ?? []).reduce((s, i) => s + (i.total ?? 0), 0);
  const odos = visits
    .map((w) => w.odometer_in)
    .filter((n): n is number => n != null)
    .sort((a, b) => a - b);
  const firstVisit = visits.length > 0 ? visits[visits.length - 1].created_at : null;
  const preparedOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      <PageHeader
        title={`Service History · ${vehicleName(v)}`}
        subtitle="Complete record of every visit — print it for the customer or the glovebox"
        backHref={`/vehicles/${params.id}`}
        actions={<PrintButton label="Print / Save PDF" />}
      />

      <Card className="print:border-0 print:shadow-none">
        {/* Report header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-lg font-bold text-slate-900">{shop?.shop_name ?? "Joe's Garage"}</p>
            <p className="text-xs text-slate-500">
              {[shop?.phone, shop?.email].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{vehicleName(v)}</span>
              {v.customers && <> · owned by {customerName(v.customers)}</>}
            </p>
            <p className="text-xs text-slate-500">
              {[
                v.vin ? `VIN ${v.vin}` : null,
                v.license_plate ? `Plate ${v.license_plate}` : null,
                v.engine,
              ]
                .filter(Boolean)
                .join(" · ") || " "}
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p className="text-2xl font-bold uppercase tracking-wide text-slate-300">Service History</p>
            <p>Prepared {preparedOn}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 py-5 sm:grid-cols-4">
          <Stat label="Visits" value={visits.length} />
          <Stat label="Lifetime spend" value={formatCurrency(lifetimeSpend)} tone="green" />
          <Stat label="First seen" value={firstVisit ? formatDate(firstVisit) : "—"} />
          <Stat
            label="Odometer range"
            value={odos.length > 0 ? `${odos[0].toLocaleString()}–${odos[odos.length - 1].toLocaleString()}` : "—"}
          />
        </div>

        {/* Visits, newest first */}
        {visits.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No service history recorded for this vehicle yet.</p>
        ) : (
          <div className="space-y-5">
            {visits.map((w) => {
              const items = (w.work_order_items ?? []).sort((a, b) => a.sort_order - b.sort_order);
              const visitTotal = items.reduce((s, i) => s + i.line_total, 0);
              return (
                <div key={w.id} className="break-inside-avoid rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">{formatDate(w.created_at)}</span>
                      <Link href={`/work-orders/${w.id}`} className="text-sm font-semibold text-brand-700 hover:underline print:no-underline">
                        {w.number}
                      </Link>
                      <Badge tone={WORK_ORDER_STATUS[w.status].tone}>{WORK_ORDER_STATUS[w.status].label}</Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      {w.odometer_in != null && <>Odometer {w.odometer_in.toLocaleString()} mi</>}
                      {w.assigned?.full_name && <> · Tech: {w.assigned.full_name}</>}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <Note label="Concern" value={w.customer_concern} />
                    <Note label="Diagnosis" value={w.diagnosis} />
                    <Note label="Work performed" value={w.work_performed} />
                    <Note label="Recommended" value={w.recommendations} />
                  </div>

                  {items.length > 0 && (
                    <table className="mt-3 w-full text-sm">
                      <tbody>
                        {items.map((it) => (
                          <tr key={it.id} className="border-t border-slate-100">
                            <td className="py-1.5 pr-2 text-xs text-slate-400">{LINE_ITEM_TYPES[it.item_type]}</td>
                            <td className="py-1.5 pr-2 text-slate-700">{it.description}</td>
                            <td className="py-1.5 px-2 text-right text-slate-500">
                              {it.quantity} × {formatCurrency(it.unit_price)}
                            </td>
                            <td className="py-1.5 pl-2 text-right font-medium tabular-nums">{formatCurrency(it.line_total)}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-slate-200">
                          <td colSpan={3} className="py-1.5 pr-2 text-right text-xs font-semibold uppercase text-slate-400">
                            Visit total
                          </td>
                          <td className="py-1.5 pl-2 text-right font-bold tabular-nums text-slate-800">
                            {formatCurrency(visitTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {w.invoices && (
                    <p className="mt-2 text-xs text-slate-500">
                      Invoiced as{" "}
                      <Link href={`/invoices/${w.invoices.id}`} className="font-medium text-brand-600 hover:underline print:no-underline">
                        {w.invoices.number}
                      </Link>{" "}
                      · {formatCurrency(w.invoices.total)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-6 border-t border-slate-200 pt-3 text-xs text-slate-400">
          Generated from {shop?.shop_name ?? "the shop"}&apos;s records. Recommended items reflect the
          technician&apos;s notes at the time of service.
        </p>
      </Card>
    </div>
  );
}

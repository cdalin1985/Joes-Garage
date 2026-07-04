import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getShopSettings } from "@/lib/queries";
import { PageHeader, Card, Badge } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { customerName, vehicleName } from "@/lib/display";
import { formatCurrency, formatDate } from "@/lib/format";
import { WORK_ORDER_STATUS } from "@/lib/constants";
import type {
  Customer,
  Vehicle,
  Profile,
  WorkOrder,
  WorkOrderItem,
  Inspection,
  InspectionItem,
} from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Item = WorkOrderItem & { technician: Profile | null };

const RATING_META: Record<string, { label: string; dot: string; text: string }> = {
  red: { label: "Needs attention now", dot: "bg-red-500", text: "text-red-600" },
  yellow: { label: "Watch / plan soon", dot: "bg-amber-400", text: "text-amber-600" },
  green: { label: "Looks good", dot: "bg-emerald-500", text: "text-emerald-600" },
  na: { label: "Not checked", dot: "bg-slate-300", text: "text-slate-400" },
};

function CCC({ n, label, value, accent }: { n: string; label: string; value: string | null; accent: string }) {
  return (
    <div className="flex gap-3">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${accent}`}>
        {n}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="whitespace-pre-wrap text-sm text-slate-800">{value?.trim() || <span className="text-slate-300">—</span>}</p>
      </div>
    </div>
  );
}

export default async function RepairOrderPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const id = params.id;

  const [{ data }, shop] = await Promise.all([
    supabase
      .from("work_orders")
      .select("*, customers(*), vehicles(*), assigned:assigned_to(*), work_order_items(*, technician:technician_id(*))")
      .eq("id", id)
      .single(),
    getShopSettings(),
  ]);
  if (!data) notFound();

  const w = data as WorkOrder & {
    customers: Customer | null;
    vehicles: Vehicle | null;
    assigned: Profile | null;
    work_order_items: Item[];
  };

  const items = (w.work_order_items ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const labor = items.filter((i) => i.item_type === "labor");
  const parts = items.filter((i) => i.item_type === "part");
  const others = items.filter((i) => i.item_type !== "labor" && i.item_type !== "part");

  const laborHours = labor.reduce((s, i) => s + i.quantity, 0);
  const laborTotal = labor.reduce((s, i) => s + i.line_total, 0);
  const partsTotal = parts.reduce((s, i) => s + i.line_total, 0);
  const otherTotal = others.reduce((s, i) => s + i.line_total, 0);
  const subtotal = laborTotal + partsTotal + otherTotal;
  const taxRate = shop?.default_tax_rate ?? 0;
  const taxableBase = items.filter((i) => i.taxable).reduce((s, i) => s + i.line_total, 0);
  const tax = Math.round(taxableBase * taxRate * 100) / 100;
  const total = subtotal + tax;

  // Digital inspection summary (a "better than TRACS" touch: the RO references the visual inspection).
  const { data: inspData } = await supabase
    .from("inspections")
    .select("*")
    .eq("work_order_id", id)
    .order("created_at", { ascending: false })
    .limit(1);
  const inspection = (inspData as Inspection[] | null)?.[0] ?? null;
  let inspCounts: Record<string, number> = {};
  let inspItems: InspectionItem[] = [];
  if (inspection) {
    const { data: iiData } = await supabase
      .from("inspection_items")
      .select("*")
      .eq("inspection_id", inspection.id)
      .order("sort_order");
    inspItems = (iiData as InspectionItem[]) ?? [];
    inspCounts = inspItems.reduce((acc, it) => {
      acc[it.rating] = (acc[it.rating] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  const attention = inspItems.filter((i) => i.rating === "red" || i.rating === "yellow");
  const shareUrl = inspection ? `/inspect/${inspection.share_token}` : null;

  return (
    <div>
      <PageHeader
        title={`Repair Order ${w.number ?? ""}`}
        subtitle="Print for the customer or the tech's clipboard"
        backHref={`/work-orders/${id}`}
        actions={<PrintButton label="Print / Save PDF" />}
      />

      <Card className="print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500 font-display text-sm font-bold text-slate-900">JG</span>
              <div>
                <p className="text-lg font-bold text-slate-900">{shop?.shop_name ?? "Joe's Garage"}</p>
                <p className="text-xs text-slate-500">{[shop?.address_line1, shop?.city, shop?.state, shop?.postal_code].filter(Boolean).join(", ")}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">{[shop?.phone, shop?.email].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold uppercase tracking-wide text-slate-300">Repair Order</p>
            <p className="text-lg font-semibold text-slate-800">{w.number}</p>
            <p className="text-xs text-slate-500">Opened {formatDate(w.created_at)}</p>
            {w.promised_at && <p className="text-xs text-slate-500">Promised {formatDate(w.promised_at)}</p>}
            <div className="mt-1 flex justify-end">
              <Badge tone={WORK_ORDER_STATUS[w.status].tone}>{WORK_ORDER_STATUS[w.status].label}</Badge>
            </div>
          </div>
        </div>

        {/* Customer + vehicle + service writer */}
        <div className="grid gap-6 py-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Customer</p>
            <p className="mt-1 font-medium text-slate-800">{customerName(w.customers)}</p>
            {w.customers?.phone && <p className="text-sm text-slate-500">{w.customers.phone}</p>}
            {w.customers?.email && <p className="text-sm text-slate-500">{w.customers.email}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Vehicle</p>
            <p className="mt-1 font-medium text-slate-800">{w.vehicles ? vehicleName(w.vehicles) : "—"}</p>
            {w.vehicles?.vin && <p className="text-sm text-slate-500">VIN {w.vehicles.vin}</p>}
            {w.vehicles?.license_plate && <p className="text-sm text-slate-500">Plate {w.vehicles.license_plate}</p>}
          </div>
          <div className="text-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">Service details</p>
            <div className="mt-1 space-y-0.5 text-slate-600">
              <p>Tech: <span className="font-medium text-slate-800">{w.assigned?.full_name ?? "Unassigned"}</span></p>
              <p>Odometer in: <span className="font-medium text-slate-800">{w.odometer_in != null ? w.odometer_in.toLocaleString() : "—"}</span></p>
              <p>Odometer out: <span className="font-medium text-slate-800">{w.odometer_out != null ? w.odometer_out.toLocaleString() : "—"}</span></p>
            </div>
          </div>
        </div>

        {/* The three C's */}
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3 print:bg-transparent">
          <CCC n="1" label="Complaint (customer concern)" value={w.customer_concern} accent="bg-brand-500" />
          <CCC n="2" label="Cause (diagnosis)" value={w.diagnosis} accent="bg-amber-500" />
          <CCC n="3" label="Correction (work performed)" value={w.work_performed} accent="bg-emerald-500" />
        </div>

        {/* Jobs & parts */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Labor</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2 pr-2 w-6"></th>
                <th className="py-2 pr-2">Job</th>
                <th className="py-2 px-2">Tech</th>
                <th className="py-2 px-2 text-right">Hours</th>
                <th className="py-2 px-2 text-right">Rate</th>
                <th className="py-2 pl-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {labor.length === 0 ? (
                <tr><td colSpan={6} className="py-3 text-center text-slate-400">No labor lines.</td></tr>
              ) : labor.map((i) => (
                <tr key={i.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 text-center">{i.is_complete ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">○</span>}</td>
                  <td className="py-2 pr-2 text-slate-700">{i.description}</td>
                  <td className="py-2 px-2 text-slate-500">{i.technician?.full_name?.split(" ")[0] ?? "—"}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{i.quantity.toFixed(1)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatCurrency(i.unit_price)}</td>
                  <td className="py-2 pl-2 text-right font-medium tabular-nums">{formatCurrency(i.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Parts</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2 pr-2">Part</th>
                <th className="py-2 px-2 text-right">Qty</th>
                <th className="py-2 px-2 text-right">Price</th>
                <th className="py-2 pl-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {parts.length === 0 ? (
                <tr><td colSpan={4} className="py-3 text-center text-slate-400">No parts lines.</td></tr>
              ) : parts.map((i) => (
                <tr key={i.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 text-slate-700">{i.description}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{i.quantity}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatCurrency(i.unit_price)}</td>
                  <td className="py-2 pl-2 text-right font-medium tabular-nums">{formatCurrency(i.line_total)}</td>
                </tr>
              ))}
              {others.map((i) => (
                <tr key={i.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 text-slate-700">{i.description}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{i.quantity}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatCurrency(i.unit_price)}</td>
                  <td className="py-2 pl-2 text-right font-medium tabular-nums">{formatCurrency(i.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Labor ({laborHours.toFixed(1)} hrs)</dt><dd className="font-medium tabular-nums">{formatCurrency(laborTotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Parts</dt><dd className="font-medium tabular-nums">{formatCurrency(partsTotal)}</dd></div>
            {otherTotal !== 0 && <div className="flex justify-between"><dt className="text-slate-500">Other</dt><dd className="font-medium tabular-nums">{formatCurrency(otherTotal)}</dd></div>}
            <div className="flex justify-between border-t border-slate-200 pt-1.5"><dt className="text-slate-500">Subtotal</dt><dd className="font-medium tabular-nums">{formatCurrency(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Tax ({(taxRate * 100).toFixed(2).replace(/\.00$/, "")}%)</dt><dd className="font-medium tabular-nums">{formatCurrency(tax)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base"><dt className="font-semibold text-slate-700">Estimated total</dt><dd className="font-bold tabular-nums text-slate-900">{formatCurrency(total)}</dd></div>
          </dl>
        </div>

        {/* Digital inspection band */}
        {inspection && (
          <div className="mt-6 rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Digital vehicle inspection</p>
              <div className="flex items-center gap-3 text-xs">
                {(["red", "yellow", "green", "na"] as const).map((r) => (
                  <span key={r} className="inline-flex items-center gap-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${RATING_META[r].dot}`} />
                    <span className={RATING_META[r].text}>{inspCounts[r] ?? 0}</span>
                  </span>
                ))}
              </div>
            </div>
            {attention.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {attention.map((it) => (
                  <li key={it.id} className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${RATING_META[it.rating].dot}`} />
                    <span className="text-slate-700"><span className="font-medium">{it.label}</span>{it.notes ? ` — ${it.notes}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
            {shareUrl && (
              <p className="mt-3 text-xs text-slate-500">
                Full inspection with photos: <Link href={shareUrl} className="font-medium text-brand-600 underline">{shareUrl}</Link>
              </p>
            )}
          </div>
        )}

        {/* Recommended / declined future work */}
        {w.recommendations?.trim() && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 print:bg-transparent">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Recommended future service</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">{w.recommendations}</p>
          </div>
        )}

        {/* Authorization */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Authorization</p>
          <p className="mt-1 text-xs text-slate-500">
            {shop?.estimate_terms || "I authorize the repairs described above and the use of necessary parts and materials."}
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="h-8 border-b border-slate-400" />
              <p className="mt-1 text-xs text-slate-500">Customer signature (initial authorization)</p>
            </div>
            <div>
              <div className="h-8 border-b border-slate-400" />
              <p className="mt-1 text-xs text-slate-500">Date</p>
            </div>
            <div>
              <div className="h-8 border-b border-slate-400" />
              <p className="mt-1 text-xs text-slate-500">Supplemental authorization (added work)</p>
            </div>
            <div>
              <div className="h-8 border-b border-slate-400" />
              <p className="mt-1 text-xs text-slate-500">Date</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

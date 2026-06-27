import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, SectionTitle, Alert } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import {
  setWorkOrderStatus,
  deleteWorkOrder,
  invoiceWorkOrder,
} from "@/lib/actions/work-orders";
import { createInspection } from "@/lib/actions/inspections";
import { customerName, vehicleName } from "@/lib/display";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  WORK_ORDER_STATUS,
  WORK_ORDER_PRIORITY,
  WORK_ORDER_STATUS_FLOW,
  LINE_ITEM_TYPES,
} from "@/lib/constants";
import type {
  Customer,
  Inspection,
  Invoice,
  Profile,
  Vehicle,
  WorkOrder,
  WorkOrderItem,
  WorkOrderStatus,
} from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const id = params.id;

  const { data } = await supabase
    .from("work_orders")
    .select("*, customers(*), vehicles(*), assigned:assigned_to(*), invoices(*), work_order_items(*)")
    .eq("id", id)
    .single();
  if (!data) notFound();

  const w = data as WorkOrder & {
    customers: Customer | null;
    vehicles: Vehicle | null;
    assigned: Profile | null;
    invoices: Invoice | null;
    work_order_items: WorkOrderItem[];
  };
  const items = (w.work_order_items ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);

  const { data: inspectionData } = await supabase
    .from("inspections")
    .select("*")
    .eq("work_order_id", id)
    .order("created_at", { ascending: false });
  const inspections = (inspectionData as Inspection[]) ?? [];

  return (
    <div>
      <PageHeader
        title={`Work Order ${w.number}`}
        subtitle={[customerName(w.customers), w.vehicles ? vehicleName(w.vehicles) : null]
          .filter(Boolean)
          .join(" · ")}
        backHref="/work-orders"
        actions={
          <>
            <Badge tone={WORK_ORDER_STATUS[w.status].tone}>{WORK_ORDER_STATUS[w.status].label}</Badge>
            <Badge tone={WORK_ORDER_PRIORITY[w.priority].tone}>{WORK_ORDER_PRIORITY[w.priority].label}</Badge>
            <Link href={`/work-orders/${id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <DeleteButton action={deleteWorkOrder.bind(null, id)} iconOnly />
          </>
        }
      />

      {/* Status workflow */}
      <Card className="mb-5">
        <SectionTitle>Update status</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {WORK_ORDER_STATUS_FLOW.filter((s) => s !== w.status).map((s) => (
            <form key={s} action={setWorkOrderStatus.bind(null, id, s as WorkOrderStatus)}>
              <button className="btn-secondary !py-1.5 text-xs">{WORK_ORDER_STATUS[s].label}</button>
            </form>
          ))}
          <form action={setWorkOrderStatus.bind(null, id, "cancelled")}>
            <button className="btn-ghost !py-1.5 text-xs text-red-500">Cancel job</button>
          </form>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <SectionTitle>Job details</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <DetailBlock label="Customer concern" value={w.customer_concern} />
              <DetailBlock label="Diagnosis" value={w.diagnosis} />
              <DetailBlock label="Work performed" value={w.work_performed} />
              <DetailBlock label="Recommendations" value={w.recommendations} />
            </div>
          </Card>

          <Card pad={false}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">Parts &amp; labor</h2>
              <span className="text-sm font-semibold text-slate-700">{formatCurrency(subtotal)}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-center text-slate-400">No parts or labor logged.</td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="border-b border-slate-100">
                      <td className="px-5 py-2 text-xs text-slate-400">{LINE_ITEM_TYPES[it.item_type]}</td>
                      <td className="px-2 py-2 text-slate-700">{it.description}</td>
                      <td className="px-2 py-2 text-right text-slate-500">
                        {it.quantity} × {formatCurrency(it.unit_price)}
                      </td>
                      <td className="px-5 py-2 text-right font-medium">{formatCurrency(it.line_total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          {w.notes && (
            <Card>
              <SectionTitle>Internal notes</SectionTitle>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{w.notes}</p>
            </Card>
          )}

          <Card>
            <SectionTitle
              action={
                <form action={createInspection.bind(null, id, w.vehicle_id)}>
                  <button className="btn-secondary !py-1.5 text-xs">+ New inspection</button>
                </form>
              }
            >
              Digital vehicle inspections
            </SectionTitle>
            {inspections.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">
                No inspection started for this visit yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {inspections.map((insp) => (
                  <li key={insp.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">{formatDate(insp.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <Badge tone={insp.status === "completed" ? "green" : "amber"}>
                        {insp.status === "completed" ? "Completed" : "In progress"}
                      </Badge>
                      <Link
                        href={`/work-orders/${id}/inspection/${insp.id}`}
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        Open
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle>Summary</SectionTitle>
            <dl className="space-y-2 text-sm">
              <Row label="Technician" value={w.assigned?.full_name ?? "Unassigned"} />
              <Row label="Odometer in" value={w.odometer_in ? `${w.odometer_in.toLocaleString()} mi` : "—"} />
              <Row label="Odometer out" value={w.odometer_out ? `${w.odometer_out.toLocaleString()} mi` : "—"} />
              <Row label="Opened" value={formatDate(w.created_at)} />
              <Row label="Started" value={w.started_at ? formatDate(w.started_at) : "—"} />
              <Row label="Completed" value={w.completed_at ? formatDate(w.completed_at) : "—"} />
            </dl>
          </Card>

          <Card>
            <SectionTitle>Billing</SectionTitle>
            {w.invoices ? (
              <Alert tone="green">
                Invoiced:{" "}
                <Link href={`/invoices/${w.invoices.id}`} className="font-semibold underline">
                  {w.invoices.number}
                </Link>{" "}
                ({formatCurrency(w.invoices.total)})
              </Alert>
            ) : (
              <form action={invoiceWorkOrder.bind(null, id)}>
                <button className="btn-accent w-full" disabled={items.length === 0}>
                  Create invoice from this work order
                </button>
                {items.length === 0 && (
                  <p className="mt-2 text-xs text-slate-400">Add parts &amp; labor first.</p>
                )}
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-slate-600">{value || "—"}</p>
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

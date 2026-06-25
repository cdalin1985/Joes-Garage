import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, SectionTitle } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { customerName, vehicleName } from "@/lib/display";
import { formatCurrency, formatDate } from "@/lib/format";
import { WORK_ORDER_STATUS } from "@/lib/constants";
import type { Customer, Vehicle, WorkOrder, Invoice } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type WO = WorkOrder & { invoices: Invoice | null };

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, customers(*)")
    .eq("id", params.id)
    .single();
  if (!vehicle) notFound();
  const v = vehicle as Vehicle & { customers: Customer | null };

  const { data: workOrders } = await supabase
    .from("work_orders")
    .select("*, invoices(*)")
    .eq("vehicle_id", params.id)
    .order("created_at", { ascending: false });
  const wos = (workOrders as WO[]) ?? [];

  return (
    <div>
      <PageHeader
        title={vehicleName(v)}
        subtitle={v.customers ? `Owned by ${customerName(v.customers)}` : undefined}
        backHref={v.customer_id ? `/customers/${v.customer_id}` : "/vehicles"}
        actions={
          <>
            <Link href={`/work-orders/new?vehicle=${v.id}`} className="btn-secondary">
              New work order
            </Link>
            <Link href={`/vehicles/${v.id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <DeleteButton action={deleteVehicle.bind(null, v.id, v.customer_id)} iconOnly />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <SectionTitle>Specs</SectionTitle>
          <dl className="space-y-2 text-sm">
            <Row label="Year" value={v.year ?? "—"} />
            <Row label="Make" value={v.make ?? "—"} />
            <Row label="Model" value={v.model ?? "—"} />
            <Row label="Trim" value={v.trim ?? "—"} />
            <Row label="Color" value={v.color ?? "—"} />
            <Row label="Mileage" value={v.mileage ? `${v.mileage.toLocaleString()} mi` : "—"} />
            <Row label="VIN" value={<span className="font-mono text-xs">{v.vin ?? "—"}</span>} />
            <Row label="Plate" value={v.license_plate ? `${v.license_plate} ${v.license_state ?? ""}` : "—"} />
            <Row label="Engine" value={v.engine ?? "—"} />
            <Row label="Transmission" value={v.transmission ?? "—"} />
            <Row label="Drivetrain" value={v.drivetrain ?? "—"} />
            {v.unit_number && <Row label="Unit #" value={v.unit_number} />}
          </dl>
          {v.notes && <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">{v.notes}</p>}
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>Service history</SectionTitle>
          {wos.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No service history yet for this vehicle.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {wos.map((w) => (
                <li key={w.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <Link href={`/work-orders/${w.id}`} className="font-medium text-brand-700 hover:underline">
                      {w.number}
                    </Link>
                    <div className="flex items-center gap-3">
                      <Badge tone={WORK_ORDER_STATUS[w.status].tone}>{WORK_ORDER_STATUS[w.status].label}</Badge>
                      <span className="text-xs text-slate-400">{formatDate(w.created_at)}</span>
                    </div>
                  </div>
                  {w.customer_concern && (
                    <p className="mt-1 text-sm text-slate-600">{w.customer_concern}</p>
                  )}
                  <div className="mt-1 flex items-center gap-4 text-xs text-slate-400">
                    {w.odometer_in && <span>{w.odometer_in.toLocaleString()} mi</span>}
                    {w.invoices && (
                      <Link href={`/invoices/${w.invoices.id}`} className="text-brand-600 hover:underline">
                        {w.invoices.number} · {formatCurrency(w.invoices.total)}
                      </Link>
                    )}
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value}</dd>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { customerName, vehicleName } from "@/lib/display";
import { formatDate } from "@/lib/format";
import { WORK_ORDER_STATUS, WORK_ORDER_PRIORITY } from "@/lib/constants";
import type { Customer, Profile, Vehicle, WorkOrder } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = WorkOrder & {
  customers: Customer | null;
  vehicles: Vehicle | null;
  assigned: Profile | null;
};

const OPEN_STATUSES = [
  "intake",
  "scheduled",
  "in_progress",
  "awaiting_parts",
  "awaiting_approval",
];

export default async function WorkOrdersPage({ searchParams }: { searchParams: { view?: string } }) {
  const supabase = createClient();
  const showAll = searchParams.view === "all";

  let query = supabase
    .from("work_orders")
    .select("*, customers(*), vehicles(*), assigned:assigned_to(*)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (!showAll) query = query.in("status", OPEN_STATUSES);

  const { data } = await query;
  const rows = (data as Row[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Work Orders"
        subtitle={showAll ? "All work orders" : "Open jobs in the shop"}
        actions={
          <Link href="/work-orders/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New work order
          </Link>
        }
      />

      <div className="mb-4 flex gap-2 print:hidden">
        <Link
          href="/work-orders"
          className={`rounded-full px-3 py-1 text-sm ${!showAll ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
        >
          Open
        </Link>
        <Link
          href="/work-orders?view=all"
          className={`rounded-full px-3 py-1 text-sm ${showAll ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
        >
          All
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No work orders"
          description="Open a work order when a vehicle comes in for service."
          action={
            <Link href="/work-orders/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> New work order
            </Link>
          }
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th>WO #</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Tech</th>
              <th>Opened</th>
            </tr>
          }
        >
          {rows.map((w) => (
            <tr key={w.id}>
              <td>
                <Link href={`/work-orders/${w.id}`} className="font-medium text-brand-700 hover:underline">
                  {w.number}
                </Link>
              </td>
              <td>{customerName(w.customers)}</td>
              <td className="text-slate-500">{w.vehicles ? vehicleName(w.vehicles) : "—"}</td>
              <td>
                <Badge tone={WORK_ORDER_PRIORITY[w.priority].tone}>{WORK_ORDER_PRIORITY[w.priority].label}</Badge>
              </td>
              <td>
                <Badge tone={WORK_ORDER_STATUS[w.status].tone}>{WORK_ORDER_STATUS[w.status].label}</Badge>
              </td>
              <td className="text-slate-500">{w.assigned?.full_name ?? "—"}</td>
              <td>{formatDate(w.created_at)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

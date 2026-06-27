import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge, Card } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { customerName, vehicleName } from "@/lib/display";
import { formatDate } from "@/lib/format";
import { WORK_ORDER_STATUS, WORK_ORDER_PRIORITY, WORK_ORDER_STATUS_FLOW } from "@/lib/constants";
import { setWorkOrderStatus } from "@/lib/actions/work-orders";
import type { Customer, Profile, Vehicle, WorkOrder, WorkOrderStatus } from "@/lib/database.types";

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
  const view = searchParams.view === "all" ? "all" : searchParams.view === "board" ? "board" : "open";
  const showAll = view === "all";
  const isBoard = view === "board";

  let query = supabase
    .from("work_orders")
    .select("*, customers(*), vehicles(*), assigned:assigned_to(*)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (!showAll && !isBoard) query = query.in("status", OPEN_STATUSES);
  if (isBoard) query = query.neq("status", "cancelled");

  const { data } = await query;
  const rows = (data as Row[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Work Orders"
        subtitle={isBoard ? "Visual status board" : showAll ? "All work orders" : "Open jobs in the shop"}
        actions={
          <Link href="/work-orders/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New work order
          </Link>
        }
      />

      <div className="mb-4 flex gap-2 print:hidden">
        <Link
          href="/work-orders"
          className={`rounded-full px-3 py-1 text-sm ${view === "open" ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
        >
          Open
        </Link>
        <Link
          href="/work-orders?view=all"
          className={`rounded-full px-3 py-1 text-sm ${showAll ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
        >
          All
        </Link>
        <Link
          href="/work-orders?view=board"
          className={`rounded-full px-3 py-1 text-sm ${isBoard ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
        >
          Board
        </Link>
      </div>

      {isBoard ? (
        <WorkOrderBoard rows={rows} />
      ) : rows.length === 0 ? (
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

function WorkOrderBoard({ rows }: { rows: Row[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {WORK_ORDER_STATUS_FLOW.map((status) => {
        const cards = rows.filter((w) => w.status === status);
        const nextIdx = WORK_ORDER_STATUS_FLOW.indexOf(status) + 1;
        const nextStatus: WorkOrderStatus | null = WORK_ORDER_STATUS_FLOW[nextIdx] ?? null;
        return (
          <div key={status} className="w-72 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <Badge tone={WORK_ORDER_STATUS[status].tone}>{WORK_ORDER_STATUS[status].label}</Badge>
              <span className="text-xs font-medium text-slate-400">{cards.length}</span>
            </div>
            <div className="space-y-2">
              {cards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                  Nothing here
                </div>
              ) : (
                cards.map((w) => (
                  <Card key={w.id} className="!p-3">
                    <Link href={`/work-orders/${w.id}`} className="font-medium text-brand-700 hover:underline">
                      {w.number}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate-600">{customerName(w.customers)}</p>
                    {w.vehicles && <p className="text-xs text-slate-400">{vehicleName(w.vehicles)}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <Badge tone={WORK_ORDER_PRIORITY[w.priority].tone}>{WORK_ORDER_PRIORITY[w.priority].label}</Badge>
                      {nextStatus && (
                        <form action={setWorkOrderStatus.bind(null, w.id, nextStatus)}>
                          <button className="text-xs font-semibold text-brand-600 hover:underline">
                            {WORK_ORDER_STATUS[nextStatus].label} →
                          </button>
                        </form>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

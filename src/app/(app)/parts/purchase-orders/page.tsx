import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge, Stat, Alert } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { formatDate } from "@/lib/format";
import { PURCHASE_ORDER_STATUS } from "@/lib/constants";
import type { PurchaseOrder, Vendor, Part } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage() {
  const supabase = createClient();

  const { data: poData } = await supabase
    .from("purchase_orders")
    .select("*, vendors(*)")
    .order("created_at", { ascending: false });
  const purchaseOrders = (poData as (PurchaseOrder & { vendors: Vendor | null })[]) ?? [];

  const { data: partData } = await supabase
    .from("parts")
    .select("*")
    .eq("is_active", true)
    .order("name");
  const parts = (partData as Part[]) ?? [];
  const lowStock = parts.filter((p) => p.reorder_level > 0 && p.quantity_on_hand <= p.reorder_level);

  const open = purchaseOrders.filter((po) => po.status === "ordered" || po.status === "partial");

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Order parts from vendors and track receiving"
        backHref="/parts"
        actions={
          <Link href="/parts/purchase-orders/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New PO
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <Stat label="Open purchase orders" value={open.length} tone={open.length ? "blue" : "slate"} />
        <Stat label="Low-stock parts" value={lowStock.length} tone={lowStock.length ? "amber" : "slate"} />
      </div>

      {lowStock.length > 0 && (
        <Alert tone="amber" title="Reorder suggestions">
          {lowStock.length} part{lowStock.length === 1 ? "" : "s"} at or below reorder level:{" "}
          {lowStock
            .slice(0, 6)
            .map((p) => p.name)
            .join(", ")}
          {lowStock.length > 6 ? ", …" : ""}.{" "}
          <Link href="/parts/purchase-orders/new" className="font-semibold underline">
            Create a PO
          </Link>{" "}
          to restock.
        </Alert>
      )}

      {purchaseOrders.length === 0 ? (
        <EmptyState
          title="No purchase orders yet"
          description="Order parts from your vendors and track what's been received."
          action={
            <Link href="/parts/purchase-orders/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> New PO
            </Link>
          }
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th>PO #</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Expected</th>
              <th>Created</th>
            </tr>
          }
        >
          {purchaseOrders.map((po) => (
            <tr key={po.id}>
              <td>
                <Link href={`/parts/purchase-orders/${po.id}`} className="font-medium text-brand-700 hover:underline">
                  {po.number ?? po.id.slice(0, 8)}
                </Link>
              </td>
              <td>{po.vendors?.name ?? "—"}</td>
              <td>
                <Badge tone={PURCHASE_ORDER_STATUS[po.status].tone}>{PURCHASE_ORDER_STATUS[po.status].label}</Badge>
              </td>
              <td className="text-slate-500">{po.expected_at ? formatDate(po.expected_at) : "—"}</td>
              <td className="text-slate-500">{formatDate(po.created_at)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

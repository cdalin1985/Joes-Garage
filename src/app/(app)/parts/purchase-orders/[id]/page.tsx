import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, SectionTitle } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import {
  setPurchaseOrderStatus,
  receivePurchaseOrderItem,
  deletePurchaseOrder,
} from "@/lib/actions/purchase-orders";
import { formatCurrency, formatDate } from "@/lib/format";
import { PURCHASE_ORDER_STATUS } from "@/lib/constants";
import type { PurchaseOrder, PurchaseOrderItem, Vendor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const STATUS_FLOW = ["draft", "ordered", "received"] as const;

export default async function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select("*, vendors(*), purchase_order_items(*)")
    .eq("id", params.id)
    .single();
  if (!data) notFound();

  const po = data as PurchaseOrder & { vendors: Vendor | null; purchase_order_items: PurchaseOrderItem[] };
  const items = (po.purchase_order_items ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const total = items.reduce((s, i) => s + i.line_total, 0);

  return (
    <div>
      <PageHeader
        title={`PO ${po.number ?? po.id.slice(0, 8)}`}
        subtitle={po.vendors?.name ?? undefined}
        backHref="/parts/purchase-orders"
        actions={
          <>
            <Badge tone={PURCHASE_ORDER_STATUS[po.status].tone}>{PURCHASE_ORDER_STATUS[po.status].label}</Badge>
            <DeleteButton action={deletePurchaseOrder.bind(null, po.id)} iconOnly />
          </>
        }
      />

      <Card className="mb-5">
        <SectionTitle>Update status</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {STATUS_FLOW.filter((s) => s !== po.status).map((s) => (
            <form key={s} action={setPurchaseOrderStatus.bind(null, po.id, s)}>
              <button className="btn-secondary !py-1.5 text-xs">{PURCHASE_ORDER_STATUS[s].label}</button>
            </form>
          ))}
          {po.status !== "cancelled" && (
            <form action={setPurchaseOrderStatus.bind(null, po.id, "cancelled")}>
              <button className="btn-ghost !py-1.5 text-xs text-red-500">Cancel PO</button>
            </form>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card pad={false} className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Items</h2>
            <span className="text-sm font-semibold text-slate-700">{formatCurrency(total)}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-2">Description</th>
                <th className="px-2 py-2 text-right">Ordered</th>
                <th className="px-2 py-2 text-right">Received</th>
                <th className="px-2 py-2 text-right">Unit cost</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                    No items on this PO.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-700">{it.description}</td>
                    <td className="px-2 py-2 text-right text-slate-500">{it.quantity_ordered}</td>
                    <td className="px-2 py-2 text-right">
                      <form
                        action={receivePurchaseOrderItem.bind(null, it.id, po.id)}
                        className="flex items-center justify-end gap-1"
                      >
                        <input
                          type="number"
                          name="quantity_received"
                          defaultValue={it.quantity_received}
                          min={0}
                          step="1"
                          className="input !w-16 !py-1 text-right text-xs"
                        />
                        <button className="btn-secondary !px-2 !py-1 text-xs">Save</button>
                      </form>
                    </td>
                    <td className="px-2 py-2 text-right text-slate-500">{formatCurrency(it.unit_cost)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(it.line_total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Summary</SectionTitle>
          <dl className="space-y-2 text-sm">
            <Row label="Vendor" value={po.vendors?.name ?? "—"} />
            <Row label="Expected" value={po.expected_at ? formatDate(po.expected_at) : "—"} />
            <Row label="Ordered" value={po.ordered_at ? formatDate(po.ordered_at) : "—"} />
            <Row label="Received" value={po.received_at ? formatDate(po.received_at) : "—"} />
            <Row label="Created" value={formatDate(po.created_at)} />
          </dl>
          {po.notes && (
            <>
              <p className="mt-4 text-xs font-semibold uppercase text-slate-400">Notes</p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600">{po.notes}</p>
            </>
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

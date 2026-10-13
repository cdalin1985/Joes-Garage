"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { str, num } from "@/lib/doc-helpers";

export type POEditorItem = {
  part_id: string | null;
  description: string;
  quantity_ordered: number;
  unit_cost: number;
};

function parsePOItems(formData: FormData): POEditorItem[] {
  const raw = formData.get("items");
  if (typeof raw !== "string") return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x): POEditorItem => {
      const o = x as Record<string, unknown>;
      return {
        part_id: typeof o.part_id === "string" && o.part_id ? o.part_id : null,
        description: String(o.description ?? ""),
        quantity_ordered: Number(o.quantity_ordered) || 0,
        unit_cost: Number(o.unit_cost) || 0,
      };
    })
    .filter((i) => i.description.trim() !== "" && i.quantity_ordered > 0);
}

export async function createPurchaseOrder(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = createClient();
  const items = parsePOItems(formData);

  const { data: po, error } = await supabase
    .from("purchase_orders")
    .insert({
      vendor_id: str(formData, "vendor_id"),
      expected_at: str(formData, "expected_at"),
      notes: str(formData, "notes"),
      created_by: profile.id,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (items.length > 0) {
    const rows = items.map((it, idx) => ({
      purchase_order_id: po.id,
      part_id: it.part_id,
      description: it.description,
      quantity_ordered: it.quantity_ordered,
      unit_cost: it.unit_cost,
      sort_order: idx,
    }));
    const { error: itemsError } = await supabase.from("purchase_order_items").insert(rows);
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/parts/purchase-orders");
  redirect(`/parts/purchase-orders/${po.id}`);
}

export async function setPurchaseOrderStatus(id: string, status: string) {
  await requireAdmin();
  const supabase = createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "ordered") patch.ordered_at = new Date().toISOString();
  if (status === "received") patch.received_at = new Date().toISOString();
  const { error } = await supabase.from("purchase_orders").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/parts/purchase-orders/${id}`);
}

export async function receivePurchaseOrderItem(itemId: string, poId: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const qty = num(formData, "quantity_received");
  const { error } = await supabase
    .from("purchase_order_items")
    .update({ quantity_received: qty })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  // Auto-advance PO status based on how much has been received.
  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("quantity_ordered, quantity_received")
    .eq("purchase_order_id", poId);
  const rows = (items as { quantity_ordered: number; quantity_received: number }[]) ?? [];
  const allReceived = rows.length > 0 && rows.every((r) => r.quantity_received >= r.quantity_ordered);
  const anyReceived = rows.some((r) => r.quantity_received > 0);
  await supabase
    .from("purchase_orders")
    .update({
      status: allReceived ? "received" : anyReceived ? "partial" : "ordered",
      received_at: allReceived ? new Date().toISOString() : null,
    })
    .eq("id", poId);

  revalidatePath(`/parts/purchase-orders/${poId}`);
  revalidatePath("/parts");
}

export async function deletePurchaseOrder(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/parts/purchase-orders");
  redirect("/parts/purchase-orders");
}

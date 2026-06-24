"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { parseItems, str, num, itemRows } from "@/lib/doc-helpers";
import type { WorkOrderPriority, WorkOrderStatus } from "@/lib/database.types";

function intOrNull(fd: FormData, key: string): number | null {
  const s = str(fd, key);
  if (!s) return null;
  const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function header(formData: FormData) {
  return {
    customer_id: str(formData, "customer_id"),
    vehicle_id: str(formData, "vehicle_id"),
    status: (str(formData, "status") ?? "intake") as WorkOrderStatus,
    priority: (str(formData, "priority") ?? "normal") as WorkOrderPriority,
    assigned_to: str(formData, "assigned_to"),
    odometer_in: intOrNull(formData, "odometer_in"),
    odometer_out: intOrNull(formData, "odometer_out"),
    customer_concern: str(formData, "customer_concern"),
    diagnosis: str(formData, "diagnosis"),
    work_performed: str(formData, "work_performed"),
    recommendations: str(formData, "recommendations"),
    notes: str(formData, "notes"),
  };
}

export async function createWorkOrder(formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();
  const items = parseItems(formData);

  const { data, error } = await supabase
    .from("work_orders")
    .insert({ ...header(formData), created_by: profile?.id ?? null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const id = data!.id;
  if (items.length > 0) {
    await supabase.from("work_order_items").insert(itemRows(items, "work_order_id", id));
  }

  revalidatePath("/work-orders");
  redirect(`/work-orders/${id}`);
}

export async function updateWorkOrder(id: string, formData: FormData) {
  const supabase = createClient();
  const items = parseItems(formData);

  const { error } = await supabase.from("work_orders").update(header(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("work_order_items").delete().eq("work_order_id", id);
  if (items.length > 0) {
    await supabase.from("work_order_items").insert(itemRows(items, "work_order_id", id));
  }

  revalidatePath(`/work-orders/${id}`);
  revalidatePath("/work-orders");
  redirect(`/work-orders/${id}`);
}

export async function setWorkOrderStatus(id: string, status: WorkOrderStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("work_orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/work-orders/${id}`);
  revalidatePath("/work-orders");
}

export async function deleteWorkOrder(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("work_orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/work-orders");
  redirect("/work-orders");
}

/** Build an invoice from a completed work order. */
export async function invoiceWorkOrder(id: string) {
  const supabase = createClient();
  const profile = await getProfile();

  const { data: wo, error } = await supabase
    .from("work_orders")
    .select("*, work_order_items(*)")
    .eq("id", id)
    .single();
  if (error || !wo) throw new Error(error?.message ?? "Work order not found");

  const w = wo as typeof wo & { work_order_items: Array<Record<string, unknown>> };

  // default tax rate from settings
  const { data: settings } = await supabase
    .from("shop_settings")
    .select("default_tax_rate, invoice_terms")
    .eq("id", 1)
    .single();

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      customer_id: w.customer_id,
      vehicle_id: w.vehicle_id,
      status: "draft",
      issue_date: new Date().toISOString().slice(0, 10),
      tax_rate: settings?.default_tax_rate ?? 0,
      terms: settings?.invoice_terms ?? null,
      notes: w.work_performed,
      created_by: profile?.id ?? null,
    })
    .select("id")
    .single();
  if (invErr) throw new Error(invErr.message);

  const invoiceId = inv!.id;
  const items = (w.work_order_items ?? []).map((it: Record<string, unknown>, idx: number) => ({
    invoice_id: invoiceId,
    item_type: it.item_type,
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unit_price,
    taxable: it.taxable,
    part_id: it.part_id,
    sort_order: idx,
  }));
  if (items.length > 0) {
    await supabase.from("invoice_items").insert(items);
  }

  await supabase
    .from("work_orders")
    .update({ invoice_id: invoiceId, status: "completed" })
    .eq("id", id);

  revalidatePath("/invoices");
  revalidatePath(`/work-orders/${id}`);
  redirect(`/invoices/${invoiceId}`);
}

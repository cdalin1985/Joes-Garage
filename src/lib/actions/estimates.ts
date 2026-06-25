"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { parseItems, str, num, itemRows } from "@/lib/doc-helpers";
import type { EstimateStatus } from "@/lib/database.types";

function header(formData: FormData) {
  return {
    customer_id: str(formData, "customer_id"),
    vehicle_id: str(formData, "vehicle_id"),
    issue_date: str(formData, "issue_date"),
    expiry_date: str(formData, "second_date"),
    tax_rate: num(formData, "tax_rate"),
    status: (str(formData, "status") ?? "draft") as EstimateStatus,
    customer_concern: str(formData, "customer_concern"),
    notes: str(formData, "notes"),
    terms: str(formData, "terms"),
  };
}

export async function createEstimate(formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();
  const items = parseItems(formData);

  const { data, error } = await supabase
    .from("estimates")
    .insert({ ...header(formData), created_by: profile?.id ?? null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const id = data!.id;
  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("estimate_items")
      .insert(itemRows(items, "estimate_id", id));
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/estimates");
  redirect(`/estimates/${id}`);
}

export async function updateEstimate(id: string, formData: FormData) {
  const supabase = createClient();
  const items = parseItems(formData);

  const { error } = await supabase.from("estimates").update(header(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  // Replace line items.
  await supabase.from("estimate_items").delete().eq("estimate_id", id);
  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("estimate_items")
      .insert(itemRows(items, "estimate_id", id));
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath(`/estimates/${id}`);
  revalidatePath("/estimates");
  redirect(`/estimates/${id}`);
}

export async function setEstimateStatus(id: string, status: EstimateStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("estimates").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/estimates/${id}`);
}

export async function deleteEstimate(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("estimates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/estimates");
  redirect("/estimates");
}

/** Create an invoice from an estimate (copies header + items). */
export async function convertEstimateToInvoice(id: string) {
  const supabase = createClient();
  const profile = await getProfile();

  const { data: est, error } = await supabase
    .from("estimates")
    .select("*, estimate_items(*)")
    .eq("id", id)
    .single();
  if (error || !est) throw new Error(error?.message ?? "Estimate not found");

  const e = est as typeof est & { estimate_items: Array<Record<string, unknown>> };

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      customer_id: e.customer_id,
      vehicle_id: e.vehicle_id,
      estimate_id: id,
      status: "draft",
      issue_date: new Date().toISOString().slice(0, 10),
      tax_rate: e.tax_rate,
      notes: e.notes,
      terms: e.terms,
      created_by: profile?.id ?? null,
    })
    .select("id")
    .single();
  if (invErr) throw new Error(invErr.message);

  const invoiceId = inv!.id;
  const items = (e.estimate_items ?? []).map((it: Record<string, unknown>, idx: number) => ({
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

  await supabase.from("estimates").update({ status: "converted" }).eq("id", id);

  revalidatePath("/invoices");
  revalidatePath(`/estimates/${id}`);
  redirect(`/invoices/${invoiceId}`);
}

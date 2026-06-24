"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { parseItems, str, num, itemRows } from "@/lib/doc-helpers";
import type { InvoiceStatus, PaymentMethod } from "@/lib/database.types";

function header(formData: FormData) {
  return {
    customer_id: str(formData, "customer_id"),
    vehicle_id: str(formData, "vehicle_id"),
    issue_date: str(formData, "issue_date"),
    due_date: str(formData, "second_date"),
    tax_rate: num(formData, "tax_rate"),
    status: (str(formData, "status") ?? "draft") as InvoiceStatus,
    notes: str(formData, "notes"),
    terms: str(formData, "terms"),
  };
}

export async function createInvoice(formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();
  const items = parseItems(formData);

  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...header(formData), created_by: profile?.id ?? null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const id = data!.id;
  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("invoice_items")
      .insert(itemRows(items, "invoice_id", id));
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

export async function updateInvoice(id: string, formData: FormData) {
  const supabase = createClient();
  const items = parseItems(formData);

  const { error } = await supabase.from("invoices").update(header(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("invoice_items").delete().eq("invoice_id", id);
  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("invoice_items")
      .insert(itemRows(items, "invoice_id", id));
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function recordPayment(invoiceId: string, formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();

  const payload = {
    invoice_id: invoiceId,
    amount: num(formData, "amount"),
    method: (str(formData, "method") ?? "card") as PaymentMethod,
    reference: str(formData, "reference"),
    paid_at: str(formData, "paid_at") ?? new Date().toISOString().slice(0, 10),
    notes: str(formData, "notes"),
    created_by: profile?.id ?? null,
  };

  if (payload.amount <= 0) throw new Error("Payment amount must be greater than zero.");

  const { error } = await supabase.from("payments").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function deletePayment(paymentId: string, invoiceId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/invoices/${invoiceId}`);
}

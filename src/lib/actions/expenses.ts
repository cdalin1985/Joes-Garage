"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { str, num } from "@/lib/doc-helpers";
import type { PaymentMethod } from "@/lib/database.types";

function payload(fd: FormData) {
  return {
    expense_date: str(fd, "expense_date") ?? new Date().toISOString().slice(0, 10),
    vendor_name: str(fd, "vendor_name"),
    category_id: str(fd, "category_id"),
    amount: num(fd, "amount"),
    tax_amount: num(fd, "tax_amount"),
    payment_method: (str(fd, "payment_method") ?? "card") as PaymentMethod,
    reference: str(fd, "reference"),
    description: str(fd, "description"),
    receipt_url: str(fd, "receipt_url"),
  };
}

export async function createExpense(formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();
  const { error } = await supabase
    .from("expenses")
    .insert({ ...payload(formData), created_by: profile?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  redirect("/accounting");
}

export async function updateExpense(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").update(payload(formData)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  redirect("/accounting");
}

export async function deleteExpense(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  redirect("/accounting");
}

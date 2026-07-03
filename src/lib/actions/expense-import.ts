"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import type { PaymentMethod } from "@/lib/database.types";

export type ImportRow = {
  expense_date: string;
  vendor_name: string;
  description: string;
  amount: number;
  category_id: string | null;
  payment_method: PaymentMethod;
};

/**
 * Bulk-insert expenses parsed from an uploaded bank / credit-card statement.
 * The client serializes the reviewed rows to a hidden `rows` field (same
 * JSON-in-hidden-input pattern the document editors use).
 */
export async function importExpenses(formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();

  let rows: ImportRow[] = [];
  try {
    rows = JSON.parse((formData.get("rows") as string) || "[]");
  } catch {
    throw new Error("Could not read the imported rows.");
  }

  const clean = rows
    .filter((r) => r.amount > 0 && r.expense_date)
    .map((r) => ({
      expense_date: r.expense_date,
      vendor_name: r.vendor_name || null,
      description: r.description || null,
      amount: r.amount,
      tax_amount: 0,
      category_id: r.category_id || null,
      payment_method: (r.payment_method ?? "card") as PaymentMethod,
      created_by: profile?.id ?? null,
    }));

  if (clean.length === 0) throw new Error("No valid rows to import.");

  const { error } = await supabase.from("expenses").insert(clean);
  if (error) throw new Error(error.message);

  revalidatePath("/accounting");
  redirect("/accounting");
}

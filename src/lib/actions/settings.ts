"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { str, num } from "@/lib/doc-helpers";

export async function updateSettings(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("shop_settings")
    .update({
      shop_name: str(formData, "shop_name") ?? "Joe's Garage",
      legal_name: str(formData, "legal_name"),
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      website: str(formData, "website"),
      address_line1: str(formData, "address_line1"),
      city: str(formData, "city"),
      state: str(formData, "state"),
      postal_code: str(formData, "postal_code"),
      // tax rate entered as a percent in the form; store as a decimal
      default_tax_rate: num(formData, "default_tax_rate_pct") / 100,
      default_labor_rate: num(formData, "default_labor_rate"),
      invoice_prefix: str(formData, "invoice_prefix") ?? "INV-",
      estimate_prefix: str(formData, "estimate_prefix") ?? "EST-",
      work_order_prefix: str(formData, "work_order_prefix") ?? "WO-",
      invoice_terms: str(formData, "invoice_terms"),
      estimate_terms: str(formData, "estimate_terms"),
      ein: str(formData, "ein"),
      tax_id: str(formData, "tax_id"),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

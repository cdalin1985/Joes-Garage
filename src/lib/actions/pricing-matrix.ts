"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { str, num } from "@/lib/doc-helpers";
import { priceFromMatrix } from "@/lib/pricing";
import type { Part, PricingMatrixTier } from "@/lib/database.types";

function tierPayload(fd: FormData) {
  const rawMax = str(fd, "cost_max");
  return {
    cost_min: num(fd, "cost_min") ?? 0,
    cost_max: rawMax && rawMax.trim() !== "" ? Number(rawMax) : null,
    markup_multiplier: num(fd, "markup_multiplier") ?? 1,
    label: str(fd, "label"),
    sort_order: num(fd, "sort_order") ?? 0,
  };
}

export async function createTier(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("pricing_matrix_tiers").insert(tierPayload(formData));
  if (error) throw new Error(error.message);
  revalidatePath("/parts/pricing-matrix");
}

export async function updateTier(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("pricing_matrix_tiers").update(tierPayload(formData)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/parts/pricing-matrix");
}

export async function deleteTier(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("pricing_matrix_tiers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/parts/pricing-matrix");
}

/** Recompute every active part's price from the current matrix (skips parts with no cost). */
export async function repriceAllParts() {
  await requireAdmin();
  const supabase = createClient();
  const [{ data: tierData }, { data: partData }] = await Promise.all([
    supabase.from("pricing_matrix_tiers").select("*"),
    supabase.from("parts").select("id, cost, price").eq("is_active", true),
  ]);
  const tiers = (tierData as PricingMatrixTier[]) ?? [];
  const parts = (partData as Pick<Part, "id" | "cost" | "price">[]) ?? [];

  for (const p of parts) {
    const next = priceFromMatrix(p.cost, tiers);
    if (next != null && next !== p.price) {
      await supabase.from("parts").update({ price: next }).eq("id", p.id);
    }
  }
  revalidatePath("/parts/pricing-matrix");
  revalidatePath("/parts");
}

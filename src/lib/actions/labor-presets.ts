"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str, num } from "@/lib/doc-helpers";

function payload(fd: FormData) {
  return {
    name: str(fd, "name") ?? "Unnamed job",
    category: str(fd, "category"),
    default_hours: num(fd, "default_hours", 1),
    default_rate: num(fd, "default_rate") || null,
    notes: str(fd, "notes"),
  };
}

export async function createLaborPreset(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("labor_presets").insert(payload(formData));
  if (error) throw new Error(error.message);
  revalidatePath("/labor-presets");
  redirect("/labor-presets");
}

export async function updateLaborPreset(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("labor_presets").update(payload(formData)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/labor-presets");
  redirect("/labor-presets");
}

export async function deleteLaborPreset(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("labor_presets").update({ is_active: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/labor-presets");
  redirect("/labor-presets");
}

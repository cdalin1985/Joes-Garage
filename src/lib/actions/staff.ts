"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { str, num } from "@/lib/doc-helpers";
import type { UserRole } from "@/lib/database.types";

export async function updateStaff(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: str(formData, "full_name"),
      phone: str(formData, "phone"),
      role: (str(formData, "role") ?? "front_desk") as UserRole,
      hourly_rate: str(formData, "hourly_rate") ? num(formData, "hourly_rate") : null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/staff");
}

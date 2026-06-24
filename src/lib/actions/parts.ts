"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str, num } from "@/lib/doc-helpers";

function payload(fd: FormData) {
  return {
    part_number: str(fd, "part_number"),
    name: str(fd, "name") ?? "Unnamed part",
    description: str(fd, "description"),
    category: str(fd, "category"),
    brand: str(fd, "brand"),
    cost: num(fd, "cost"),
    price: num(fd, "price"),
    quantity_on_hand: num(fd, "quantity_on_hand"),
    reorder_level: num(fd, "reorder_level"),
    bin_location: str(fd, "bin_location"),
    taxable: fd.get("taxable") === "on",
  };
}

export async function createPart(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("parts").insert(payload(formData));
  if (error) throw new Error(error.message);
  revalidatePath("/parts");
  redirect("/parts");
}

export async function updatePart(id: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("parts").update(payload(formData)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/parts");
  redirect("/parts");
}

export async function deletePart(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("parts").update({ is_active: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/parts");
  redirect("/parts");
}

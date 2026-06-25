"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

export async function createCustomer(formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();

  const payload = {
    first_name: str(formData, "first_name"),
    last_name: str(formData, "last_name"),
    company: str(formData, "company"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    mobile: str(formData, "mobile"),
    address_line1: str(formData, "address_line1"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    postal_code: str(formData, "postal_code"),
    customer_type: (str(formData, "customer_type") ?? "individual") as
      | "individual"
      | "fleet"
      | "commercial",
    preferred_contact: (str(formData, "preferred_contact") ?? "phone") as
      | "phone"
      | "email"
      | "text"
      | "any",
    tax_exempt: formData.get("tax_exempt") === "on",
    notes: str(formData, "notes"),
    created_by: profile?.id ?? null,
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/customers");
  redirect(`/customers/${data!.id}`);
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = createClient();

  const payload = {
    first_name: str(formData, "first_name"),
    last_name: str(formData, "last_name"),
    company: str(formData, "company"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    mobile: str(formData, "mobile"),
    address_line1: str(formData, "address_line1"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    postal_code: str(formData, "postal_code"),
    customer_type: (str(formData, "customer_type") ?? "individual") as
      | "individual"
      | "fleet"
      | "commercial",
    preferred_contact: (str(formData, "preferred_contact") ?? "phone") as
      | "phone"
      | "email"
      | "text"
      | "any",
    tax_exempt: formData.get("tax_exempt") === "on",
    notes: str(formData, "notes"),
  };

  const { error } = await supabase.from("customers").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/customers");
  redirect("/customers");
}

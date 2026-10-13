"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { str } from "@/lib/doc-helpers";
import type { CommunicationDirection, CommunicationType } from "@/lib/database.types";

export async function logCommunication(customerId: string, formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();
  const { error } = await supabase.from("customer_communications").insert({
    customer_id: customerId,
    type: (str(formData, "type") ?? "note") as CommunicationType,
    direction: (str(formData, "direction") ?? "outbound") as CommunicationDirection,
    summary: str(formData, "summary") ?? "",
    logged_by: profile?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/customers/${customerId}`);
}

/** Quick "logged the call" entry from the Follow-Ups worklist. */
export async function logFollowUpCall(customerId: string, formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();
  const { error } = await supabase.from("customer_communications").insert({
    customer_id: customerId,
    type: "call" as CommunicationType,
    direction: "outbound" as CommunicationDirection,
    summary: str(formData, "summary") ?? "Follow-up call",
    logged_by: profile?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/follow-ups");
  revalidatePath(`/customers/${customerId}`);
}

export async function deleteCommunication(id: string, customerId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("customer_communications").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/customers/${customerId}`);
}

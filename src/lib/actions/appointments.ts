"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { str } from "@/lib/doc-helpers";
import type { AppointmentStatus } from "@/lib/database.types";

export async function createAppointment(formData: FormData) {
  const supabase = createClient();
  const profile = await getProfile();

  const start = str(formData, "start_time");
  if (!start) throw new Error("Start time is required.");

  const { error } = await supabase.from("appointments").insert({
    title: str(formData, "title") ?? "Service Appointment",
    customer_id: str(formData, "customer_id"),
    vehicle_id: str(formData, "vehicle_id"),
    assigned_to: str(formData, "assigned_to"),
    description: str(formData, "description"),
    status: (str(formData, "status") ?? "scheduled") as AppointmentStatus,
    start_time: start,
    end_time: str(formData, "end_time"),
    created_by: profile?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/appointments");
  redirect("/appointments");
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/appointments");
}

export async function deleteAppointment(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/appointments");
  redirect("/appointments");
}

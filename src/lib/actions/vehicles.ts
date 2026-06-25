"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}
function int(fd: FormData, key: string): number | null {
  const s = str(fd, key);
  if (!s) return null;
  const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function vehiclePayload(fd: FormData) {
  return {
    year: int(fd, "year"),
    make: str(fd, "make"),
    model: str(fd, "model"),
    trim: str(fd, "trim"),
    vin: str(fd, "vin"),
    license_plate: str(fd, "license_plate"),
    license_state: str(fd, "license_state"),
    color: str(fd, "color"),
    mileage: int(fd, "mileage"),
    engine: str(fd, "engine"),
    transmission: str(fd, "transmission"),
    drivetrain: str(fd, "drivetrain"),
    unit_number: str(fd, "unit_number"),
    notes: str(fd, "notes"),
  };
}

export async function createVehicle(customerId: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase
    .from("vehicles")
    .insert({ ...vehiclePayload(formData), customer_id: customerId });
  if (error) throw new Error(error.message);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/vehicles");
  redirect(`/customers/${customerId}`);
}

export async function updateVehicle(id: string, customerId: string, formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("vehicles").update(vehiclePayload(formData)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/vehicles/${id}`);
  revalidatePath(`/customers/${customerId}`);
  redirect(`/vehicles/${id}`);
}

export async function deleteVehicle(id: string, customerId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

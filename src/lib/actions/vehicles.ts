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

export type VinDecodeResult =
  | { ok: true; data: { year: number | null; make: string | null; model: string | null; trim: string | null; engine: string | null; transmission: string | null; drivetrain: string | null } }
  | { ok: false; error: string };

/** Free, keyless VIN decode via NHTSA's public vPIC API — no paid labor-guide subscription needed. */
export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const cleaned = vin.trim().toUpperCase();
  if (cleaned.length !== 17) return { ok: false, error: "VIN must be 17 characters." };

  let json: { Results?: Record<string, string>[] };
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(cleaned)}?format=json`,
      { cache: "no-store" },
    );
    if (!res.ok) return { ok: false, error: "NHTSA lookup failed." };
    json = await res.json();
  } catch {
    return { ok: false, error: "Couldn't reach the VIN decoder. Check your connection." };
  }

  const r = json.Results?.[0];
  if (!r || !r.Make || !String(r.ErrorCode ?? "0").startsWith("0")) {
    return { ok: false, error: r?.ErrorText || "Couldn't decode this VIN." };
  }

  const displacement = parseFloat(r.DisplacementL ?? "");
  const engine = [
    Number.isFinite(displacement) ? `${displacement.toFixed(1)}L` : "",
    r.EngineCylinders ? `${r.EngineCylinders}-cyl` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ok: true,
    data: {
      year: r.ModelYear ? parseInt(r.ModelYear, 10) : null,
      make: r.Make || null,
      model: r.Model || null,
      trim: r.Trim || null,
      engine: engine || null,
      transmission: r.TransmissionStyle || null,
      drivetrain: r.DriveType || null,
    },
  };
}

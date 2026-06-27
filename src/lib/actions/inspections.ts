"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InspectionRating } from "@/lib/database.types";

/** A sensible default multi-point checklist — no paid DVI subscription needed. */
const DEFAULT_INSPECTION_TEMPLATE: { category: string; label: string }[] = [
  { category: "Under hood", label: "Engine oil level & condition" },
  { category: "Under hood", label: "Coolant level & condition" },
  { category: "Under hood", label: "Battery & terminals" },
  { category: "Under hood", label: "Belts & hoses" },
  { category: "Under hood", label: "Engine air filter" },
  { category: "Under hood", label: "Cabin air filter" },
  { category: "Brakes", label: "Front brake pads / rotors" },
  { category: "Brakes", label: "Rear brake pads / rotors" },
  { category: "Brakes", label: "Brake fluid level & condition" },
  { category: "Tires & wheels", label: "Tire tread depth (all 4)" },
  { category: "Tires & wheels", label: "Tire pressure (all 4 + spare)" },
  { category: "Tires & wheels", label: "Wheel alignment / pull" },
  { category: "Under vehicle", label: "Exhaust system" },
  { category: "Under vehicle", label: "Suspension & steering components" },
  { category: "Under vehicle", label: "CV joints / driveshaft" },
  { category: "Under vehicle", label: "Fluid leaks (oil / trans / coolant)" },
  { category: "Fluids", label: "Transmission fluid" },
  { category: "Fluids", label: "Power steering fluid" },
  { category: "Fluids", label: "Washer fluid" },
  { category: "Lights & electrical", label: "Headlights / taillights / brake lights" },
  { category: "Lights & electrical", label: "Turn signals & hazards" },
  { category: "Lights & electrical", label: "Wiper blades" },
];

export async function createInspection(workOrderId: string, vehicleId: string | null) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: inspection, error } = await supabase
    .from("inspections")
    .insert({ work_order_id: workOrderId, vehicle_id: vehicleId, performed_by: profile.id })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const items = DEFAULT_INSPECTION_TEMPLATE.map((t, i) => ({
    inspection_id: inspection.id,
    category: t.category,
    label: t.label,
    sort_order: i,
  }));
  const { error: itemsError } = await supabase.from("inspection_items").insert(items);
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath(`/work-orders/${workOrderId}`);
  redirect(`/work-orders/${workOrderId}/inspection/${inspection.id}`);
}

export async function setInspectionItemRating(
  itemId: string,
  workOrderId: string,
  rating: InspectionRating,
) {
  const supabase = createClient();
  const { error } = await supabase.from("inspection_items").update({ rating }).eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/work-orders/${workOrderId}`);
}

export async function setInspectionItemNotes(itemId: string, workOrderId: string, formData: FormData) {
  const notes = String(formData.get("notes") ?? "").trim();
  const supabase = createClient();
  const { error } = await supabase
    .from("inspection_items")
    .update({ notes: notes || null })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/work-orders/${workOrderId}`);
}

export async function uploadInspectionPhoto(itemId: string, workOrderId: string, formData: FormData) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return;

  const supabase = createClient();
  const path = `${workOrderId}/${itemId}-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("inspection-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = supabase.storage.from("inspection-photos").getPublicUrl(path);
  const { error } = await supabase
    .from("inspection_items")
    .update({ photo_url: pub.publicUrl })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/work-orders/${workOrderId}`);
}

export async function completeInspection(inspectionId: string, workOrderId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("inspections")
    .update({ status: "completed" })
    .eq("id", inspectionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/work-orders/${workOrderId}`);
  redirect(`/work-orders/${workOrderId}`);
}

export async function deleteInspection(inspectionId: string, workOrderId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("inspections").delete().eq("id", inspectionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/work-orders/${workOrderId}`);
  redirect(`/work-orders/${workOrderId}`);
}

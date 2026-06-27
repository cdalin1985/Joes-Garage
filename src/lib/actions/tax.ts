"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getProfile } from "@/lib/auth";
import { str, num } from "@/lib/doc-helpers";

const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";

// ---------------------------------------------------------------------------
// Business & tax profile (singleton)
// ---------------------------------------------------------------------------
export async function saveTaxProfile(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("tax_profile")
    .update({
      entity_type: str(formData, "entity_type") ?? "sole_prop",
      legal_business_name: str(formData, "legal_business_name"),
      dba_name: str(formData, "dba_name"),
      ein: str(formData, "ein"),
      owner_ssn_last4: str(formData, "owner_ssn_last4"),
      naics_code: str(formData, "naics_code"),
      business_description: str(formData, "business_description"),
      business_start_date: str(formData, "business_start_date"),
      state_of_operation: str(formData, "state_of_operation"),
      state_tax_id: str(formData, "state_tax_id"),
      state_unemployment_id: str(formData, "state_unemployment_id"),
      accounting_method: str(formData, "accounting_method") ?? "cash",
      first_year_filing: bool(formData, "first_year_filing"),
      materially_participates: bool(formData, "materially_participates"),
      has_employees: bool(formData, "has_employees"),
      files_1099: bool(formData, "files_1099"),
      made_payments_req_1099: bool(formData, "made_payments_req_1099"),
      owner_full_name: str(formData, "owner_full_name"),
      filing_status: str(formData, "filing_status") ?? "single",
      spouse_name: str(formData, "spouse_name"),
      spouse_w2_income: num(formData, "spouse_w2_income"),
      other_household_income: num(formData, "other_household_income"),
      dependents: Math.round(num(formData, "dependents")),
      prior_year_agi: num(formData, "prior_year_agi"),
      prior_year_total_tax: num(formData, "prior_year_total_tax"),
      use_itemized: bool(formData, "use_itemized"),
      itemized_deductions: num(formData, "itemized_deductions"),
      sep_simple_401k_contrib: num(formData, "sep_simple_401k_contrib"),
      health_insurance_premium: num(formData, "health_insurance_premium"),
      hsa_contribution: num(formData, "hsa_contribution"),
      has_home_office: bool(formData, "has_home_office"),
      home_office_sqft: Math.round(num(formData, "home_office_sqft")),
      home_total_sqft: Math.round(num(formData, "home_total_sqft")),
      home_office_use_simplified: bool(formData, "home_office_use_simplified"),
      home_rent_mortgage_year: num(formData, "home_rent_mortgage_year"),
      home_utilities_year: num(formData, "home_utilities_year"),
      home_insurance_year: num(formData, "home_insurance_year"),
      home_repairs_year: num(formData, "home_repairs_year"),
      vehicle_description: str(formData, "vehicle_description"),
      vehicle_in_service_date: str(formData, "vehicle_in_service_date"),
      vehicle_method: str(formData, "vehicle_method") ?? "standard",
      vehicle_total_miles: Math.round(num(formData, "vehicle_total_miles")),
      vehicle_commute_miles: Math.round(num(formData, "vehicle_commute_miles")),
      vehicle_actual_expenses: num(formData, "vehicle_actual_expenses"),
      vehicle_has_another: bool(formData, "vehicle_has_another"),
      pay_state_estimates: bool(formData, "pay_state_estimates"),
      state_tax_rate: num(formData, "state_tax_rate_pct") / 100,
      safe_harbor_target: Math.round(num(formData, "safe_harbor_target", 100)),
      notes: str(formData, "notes"),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);
  revalidatePath("/accounting/tax", "layout");
  redirect("/accounting/tax/profile?saved=1");
}

// ---------------------------------------------------------------------------
// Estimated tax payments
// ---------------------------------------------------------------------------
export async function addEstimatedPayment(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const profile = await getProfile();
  const { error } = await supabase.from("estimated_tax_payments").insert({
    tax_year: Math.round(num(formData, "tax_year", new Date().getFullYear())),
    quarter: Math.round(num(formData, "quarter", 1)),
    jurisdiction: str(formData, "jurisdiction") ?? "federal",
    amount: num(formData, "amount"),
    paid_date: str(formData, "paid_date"),
    confirmation: str(formData, "confirmation"),
    notes: str(formData, "notes"),
    created_by: profile?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/accounting/tax/estimated");
}

export async function deleteEstimatedPayment(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("estimated_tax_payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting/tax/estimated");
}

// ---------------------------------------------------------------------------
// Mileage log
// ---------------------------------------------------------------------------
export async function addMileageLog(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const profile = await getProfile();
  const start = num(formData, "odometer_start");
  const end = num(formData, "odometer_end");
  const miles = num(formData, "miles") || (end > start ? end - start : 0);
  const { error } = await supabase.from("mileage_logs").insert({
    trip_date: str(formData, "trip_date") ?? new Date().toISOString().slice(0, 10),
    miles,
    purpose: str(formData, "purpose"),
    from_location: str(formData, "from_location"),
    to_location: str(formData, "to_location"),
    odometer_start: start || null,
    odometer_end: end || null,
    created_by: profile?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/accounting/tax/mileage");
}

export async function deleteMileageLog(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("mileage_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting/tax/mileage");
}

// ---------------------------------------------------------------------------
// Capital assets (depreciation / Section 179)
// ---------------------------------------------------------------------------
export async function addAsset(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const profile = await getProfile();
  const { error } = await supabase.from("asset_purchases").insert({
    description: str(formData, "description") ?? "Asset",
    category: str(formData, "category") ?? "tools",
    vendor_name: str(formData, "vendor_name"),
    purchase_date: str(formData, "purchase_date") ?? new Date().toISOString().slice(0, 10),
    cost: num(formData, "cost"),
    business_use_pct: num(formData, "business_use_pct", 100),
    recovery_years: Math.round(num(formData, "recovery_years", 7)),
    section_179: bool(formData, "section_179"),
    bonus_depreciation: bool(formData, "bonus_depreciation"),
    notes: str(formData, "notes"),
    created_by: profile?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/accounting/tax/assets");
}

export async function deleteAsset(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("asset_purchases").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting/tax/assets");
}

// ---------------------------------------------------------------------------
// 1099 vendor flags
// ---------------------------------------------------------------------------
export async function saveVendor1099(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      is_1099: bool(formData, "is_1099"),
      legal_name: str(formData, "legal_name"),
      tax_id: str(formData, "tax_id"),
      tax_id_type: str(formData, "tax_id_type"),
      w9_on_file: bool(formData, "w9_on_file"),
      address: str(formData, "address"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting/tax/contractors");
}

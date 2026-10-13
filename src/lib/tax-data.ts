import { createClient } from "@/lib/supabase/server";
import {
  bucketExpenses,
  computeScheduleC,
  homeOfficeDeduction,
  projectLiability,
  quarterlyEstimates,
  vehicleDeduction,
  firstYearDepreciation,
  type ExpenseLike,
  type ScheduleCResult,
  type LiabilityResult,
  type EstimateResult,
} from "@/lib/tax";
import type {
  AssetPurchase,
  EstimatedTaxPayment,
  MileageLog,
  TaxProfile,
} from "@/lib/database.types";

/** A sensible default profile so screens render before the row exists. */
export const DEFAULT_TAX_PROFILE: TaxProfile = {
  id: 1,
  entity_type: "sole_prop",
  legal_business_name: null,
  dba_name: null,
  ein: null,
  owner_ssn_last4: null,
  naics_code: "811111",
  business_description: "Automotive repair and maintenance",
  business_start_date: null,
  state_of_operation: null,
  state_tax_id: null,
  state_unemployment_id: null,
  accounting_method: "cash",
  first_year_filing: false,
  materially_participates: true,
  has_employees: false,
  files_1099: false,
  made_payments_req_1099: null,
  owner_full_name: null,
  filing_status: "single",
  spouse_name: null,
  spouse_w2_income: 0,
  other_household_income: 0,
  dependents: 0,
  prior_year_agi: 0,
  prior_year_total_tax: 0,
  est_other_deductions: 0,
  use_itemized: false,
  itemized_deductions: 0,
  sep_simple_401k_contrib: 0,
  health_insurance_premium: 0,
  hsa_contribution: 0,
  has_home_office: false,
  home_office_sqft: 0,
  home_total_sqft: 0,
  home_office_use_simplified: true,
  home_rent_mortgage_year: 0,
  home_utilities_year: 0,
  home_insurance_year: 0,
  home_repairs_year: 0,
  vehicle_description: null,
  vehicle_in_service_date: null,
  vehicle_method: "standard",
  vehicle_total_miles: 0,
  vehicle_commute_miles: 0,
  vehicle_actual_expenses: 0,
  vehicle_has_another: true,
  pay_state_estimates: false,
  state_tax_rate: 0,
  safe_harbor_target: 100,
  notes: null,
  created_at: "",
  updated_at: "",
};

export async function getTaxProfile(): Promise<TaxProfile> {
  const supabase = createClient();
  const { data } = await supabase.from("tax_profile").select("*").eq("id", 1).maybeSingle();
  return { ...DEFAULT_TAX_PROFILE, ...((data as Partial<TaxProfile>) ?? {}) };
}

export type TaxYearData = {
  year: number;
  profile: TaxProfile;
  grossReceipts: number; // income basis per accounting method
  cashCollected: number;
  invoicedTotal: number;
  outstandingAR: number;
  salesTaxCollected: number;
  expenses: ExpenseLike[];
  loggedBusinessMiles: number;
  depreciation: number;
  scheduleC: ScheduleCResult;
  liability: LiabilityResult;
  estimate: EstimateResult;
  vehicle: ReturnType<typeof vehicleDeduction>;
  homeOffice: ReturnType<typeof homeOfficeDeduction>;
  estimatedPayments: EstimatedTaxPayment[];
  paidFederal: number;
  paidState: number;
};

/**
 * Loads everything the Tax Center needs for one year and runs the engine.
 * New tables may not exist yet on an un-migrated database — every query
 * falls back to empty so screens degrade gracefully instead of crashing.
 */
export async function getTaxYearData(year: number): Promise<TaxYearData> {
  const supabase = createClient();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const profile = await getTaxProfile();

  const [
    { data: payData },
    { data: invData },
    { data: arData },
    { data: expData },
    { data: mileData },
    { data: assetData },
    { data: estPayData },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, paid_at, invoices(total, tax_amount)")
      .gte("paid_at", start)
      .lte("paid_at", end),
    supabase
      .from("invoices")
      .select("total, tax_amount, issue_date, status")
      .gte("issue_date", start)
      .lte("issue_date", end)
      .neq("status", "void"),
    supabase.from("invoices").select("balance_due").not("status", "in", "(paid,void)"),
    supabase
      .from("expenses")
      .select("amount, tax_amount, expense_date, expense_categories(name, schedule_c_line, tax_deductible)")
      .gte("expense_date", start)
      .lte("expense_date", end),
    supabase.from("mileage_logs").select("*").gte("trip_date", start).lte("trip_date", end),
    supabase.from("asset_purchases").select("*").gte("purchase_date", start).lte("purchase_date", end),
    supabase.from("estimated_tax_payments").select("*").eq("tax_year", year),
  ]);

  type PayRow = { amount: number; invoices: { total: number; tax_amount: number } | null };
  const payments = (payData as unknown as PayRow[]) ?? [];
  const invoices = (invData as { total: number; tax_amount: number }[]) ?? [];
  const expenses = (expData as unknown as ExpenseLike[]) ?? [];
  const mileage = (mileData as MileageLog[]) ?? [];
  const assets = (assetData as AssetPurchase[]) ?? [];
  const estimatedPayments = (estPayData as EstimatedTaxPayment[]) ?? [];

  const cashCollected = payments.reduce((s, p) => s + p.amount, 0);
  const invoicedTotal = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
  const outstandingAR = ((arData as { balance_due: number }[]) ?? []).reduce(
    (s, r) => s + (r.balance_due ?? 0),
    0,
  );

  // Sales tax collected (excluded from income on Schedule C).
  let salesTaxCash = 0;
  for (const p of payments) {
    const inv = p.invoices;
    if (inv && inv.total > 0) salesTaxCash += p.amount * (inv.tax_amount / inv.total);
  }
  const salesTaxAccrual = invoices.reduce((s, i) => s + (i.tax_amount ?? 0), 0);

  const isCash = profile.accounting_method === "cash";
  const grossWithTax = isCash ? cashCollected : invoicedTotal;
  const salesTaxCollected = isCash ? salesTaxCash : salesTaxAccrual;
  const grossReceipts = Math.max(grossWithTax - salesTaxCollected, 0);

  const loggedBusinessMiles = mileage.reduce((s, m) => s + (m.miles ?? 0), 0);
  const depreciation = assets.reduce((s, a) => s + firstYearDepreciation(a), 0);

  const vehicle = vehicleDeduction(profile, loggedBusinessMiles);
  const homeOffice = homeOfficeDeduction(profile);
  const expensesByLine = bucketExpenses(expenses);

  const scheduleC = computeScheduleC({
    grossReceipts,
    expensesByLine,
    carAndTruck: vehicle.deduction,
    depreciation,
    homeOfficeDeduction: homeOffice.deduction,
  });

  const liability = projectLiability(scheduleC.netProfit, profile);
  const estimate = quarterlyEstimates(liability, profile);

  const paidFederal = estimatedPayments
    .filter((p) => p.jurisdiction === "federal")
    .reduce((s, p) => s + p.amount, 0);
  const paidState = estimatedPayments
    .filter((p) => p.jurisdiction === "state")
    .reduce((s, p) => s + p.amount, 0);

  return {
    year,
    profile,
    grossReceipts,
    cashCollected,
    invoicedTotal,
    outstandingAR,
    salesTaxCollected,
    expenses,
    loggedBusinessMiles,
    depreciation,
    scheduleC,
    liability,
    estimate,
    vehicle,
    homeOffice,
    estimatedPayments,
    paidFederal,
    paidState,
  };
}

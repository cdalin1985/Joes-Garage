/**
 * tax.ts — the "senior accountant" brain.
 *
 * Pure functions that turn the shop's bookkeeping + the owner's tax profile
 * into auto-filled federal forms and estimates. Everything here uses published
 * 2025 figures and is intentionally conservative. These are planning estimates,
 * not filed returns — every screen that uses them tells the owner to confirm
 * with a tax pro before filing.
 *
 * Sources: IRS Rev. Proc. 2024-40 (2025 inflation adjustments), 2025 Schedule C
 * & SE instructions, Notice 2025-? standard mileage (70¢/mi business).
 */

import type { FilingStatus, TaxProfile } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// 2025 constants
// ---------------------------------------------------------------------------
export const TAX_YEAR = 2025;

export const STANDARD_MILEAGE_RATE = 0.70; // $/mile, business, 2025
export const HOME_OFFICE_SIMPLIFIED_RATE = 5; // $/sqft
export const HOME_OFFICE_SIMPLIFIED_MAX_SQFT = 300; // -> max $1,500

// Self-employment tax
export const SE_EARNINGS_FACTOR = 0.9235; // net SE earnings = profit * 92.35%
export const SE_SS_RATE = 0.124; // social security portion
export const SE_MEDICARE_RATE = 0.029; // medicare portion
export const SE_TOTAL_RATE = SE_SS_RATE + SE_MEDICARE_RATE; // 15.3%
export const SS_WAGE_BASE_2025 = 176_100; // social security wage cap
export const ADDL_MEDICARE_RATE = 0.009;
export const ADDL_MEDICARE_THRESHOLD: Record<FilingStatus, number> = {
  single: 200_000,
  hoh: 200_000,
  qw: 250_000,
  mfj: 250_000,
  mfs: 125_000,
};

// Standard deduction (2025)
export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15_000,
  mfs: 15_000,
  mfj: 30_000,
  qw: 30_000,
  hoh: 22_500,
};

// QBI (Sec. 199A) taxable-income threshold where phase-out begins (2025)
export const QBI_THRESHOLD: Record<FilingStatus, number> = {
  single: 197_300,
  hoh: 197_300,
  qw: 394_600,
  mfj: 394_600,
  mfs: 197_300,
};
export const QBI_RATE = 0.20;

type Bracket = { upTo: number; rate: number };

// 2025 ordinary income tax brackets
export const BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { upTo: 11_925, rate: 0.1 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  mfs: [
    { upTo: 11_925, rate: 0.1 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 375_800, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  mfj: [
    { upTo: 23_850, rate: 0.1 },
    { upTo: 96_950, rate: 0.12 },
    { upTo: 206_700, rate: 0.22 },
    { upTo: 394_600, rate: 0.24 },
    { upTo: 501_050, rate: 0.32 },
    { upTo: 751_600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  qw: [
    { upTo: 23_850, rate: 0.1 },
    { upTo: 96_950, rate: 0.12 },
    { upTo: 206_700, rate: 0.22 },
    { upTo: 394_600, rate: 0.24 },
    { upTo: 501_050, rate: 0.32 },
    { upTo: 751_600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  hoh: [
    { upTo: 17_000, rate: 0.1 },
    { upTo: 64_850, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_500, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

// Federal quarterly estimated-tax due dates for a given tax year.
export function estimatedDueDates(year: number) {
  return [
    { quarter: 1, label: "Q1", due: `${year}-04-15` },
    { quarter: 2, label: "Q2", due: `${year}-06-16` },
    { quarter: 3, label: "Q3", due: `${year}-09-15` },
    { quarter: 4, label: "Q4", due: `${year + 1}-01-15` },
  ];
}

const round = (n: number) => Math.round(n * 100) / 100;
const clamp0 = (n: number) => (n > 0 ? n : 0);

// ---------------------------------------------------------------------------
// Schedule C
// ---------------------------------------------------------------------------
/** Official Schedule C Part II expense lines (plus COGS + vehicle) we auto-fill. */
export const SCHEDULE_C_LINES: { code: string; line: string; label: string }[] = [
  { code: "8", line: "8", label: "Advertising" },
  { code: "9", line: "9", label: "Car and truck expenses" },
  { code: "10", line: "10", label: "Commissions and fees" },
  { code: "11", line: "11", label: "Contract labor" },
  { code: "12", line: "12", label: "Depletion" },
  { code: "13", line: "13", label: "Depreciation and Section 179" },
  { code: "14", line: "14", label: "Employee benefit programs" },
  { code: "15", line: "15", label: "Insurance (other than health)" },
  { code: "16", line: "16", label: "Interest" },
  { code: "17", line: "17", label: "Legal and professional services" },
  { code: "18", line: "18", label: "Office expense" },
  { code: "19", line: "19", label: "Pension and profit-sharing plans" },
  { code: "20", line: "20", label: "Rent or lease" },
  { code: "21", line: "21", label: "Repairs and maintenance" },
  { code: "22", line: "22", label: "Supplies" },
  { code: "23", line: "23", label: "Taxes and licenses" },
  { code: "24a", line: "24a", label: "Travel" },
  { code: "24b", line: "24b", label: "Deductible meals" },
  { code: "25", line: "25", label: "Utilities" },
  { code: "26", line: "26", label: "Wages" },
  { code: "27a", line: "27a", label: "Other expenses" },
];

/** Pull the Schedule C line number out of a category's free-text mapping. */
export function scheduleCCodeFor(scheduleCLine: string | null | undefined): string {
  if (!scheduleCLine) return "27a";
  const text = scheduleCLine.toLowerCase();
  if (text.includes("cost of goods") || text.includes("part iii")) return "cogs";
  const m = scheduleCLine.match(/line\s*(\d+[ab]?)/i);
  if (m) {
    const code = m[1].toLowerCase();
    if (SCHEDULE_C_LINES.some((l) => l.code === code)) return code;
  }
  return "27a";
}

export type ExpenseLike = {
  amount: number;
  expense_categories: { schedule_c_line: string | null; tax_deductible: boolean } | null;
};

export type ScheduleCInput = {
  grossReceipts: number; // line 1
  returnsAllowances?: number; // line 2
  expensesByLine: Record<string, number>; // keyed by code, includes "cogs"
  carAndTruck?: number; // computed vehicle deduction -> line 9
  depreciation?: number; // assets -> line 13
  homeOfficeDeduction?: number; // line 30
};

export type ScheduleCResult = {
  grossReceipts: number;
  returnsAllowances: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number; // line 28
  tentativeProfit: number; // line 29
  homeOffice: number; // line 30
  netProfit: number; // line 31
  lines: { code: string; line: string; label: string; amount: number }[];
};

export function computeScheduleC(input: ScheduleCInput): ScheduleCResult {
  const returnsAllowances = input.returnsAllowances ?? 0;
  const cogs = input.expensesByLine.cogs ?? 0;
  const grossProfit = input.grossReceipts - returnsAllowances - cogs;

  const lines = SCHEDULE_C_LINES.map((l) => {
    let amount = input.expensesByLine[l.code] ?? 0;
    if (l.code === "9" && input.carAndTruck) amount += input.carAndTruck;
    if (l.code === "13" && input.depreciation) amount += input.depreciation;
    return { ...l, amount: round(amount) };
  });

  const totalExpenses = lines.reduce((s, l) => s + l.amount, 0);
  const tentativeProfit = grossProfit - totalExpenses;
  const homeOffice = input.homeOfficeDeduction ?? 0;
  const netProfit = tentativeProfit - homeOffice;

  return {
    grossReceipts: round(input.grossReceipts),
    returnsAllowances: round(returnsAllowances),
    cogs: round(cogs),
    grossProfit: round(grossProfit),
    totalExpenses: round(totalExpenses),
    tentativeProfit: round(tentativeProfit),
    homeOffice: round(homeOffice),
    netProfit: round(netProfit),
    lines,
  };
}

/** Bucket recorded expenses into Schedule C line codes. */
export function bucketExpenses(expenses: ExpenseLike[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of expenses) {
    if (e.expense_categories && e.expense_categories.tax_deductible === false) continue;
    const code = scheduleCCodeFor(e.expense_categories?.schedule_c_line);
    out[code] = (out[code] ?? 0) + e.amount;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Vehicle (standard mileage) & home office
// ---------------------------------------------------------------------------
export function vehicleDeduction(p: Pick<TaxProfile,
  "vehicle_method" | "vehicle_total_miles" | "vehicle_commute_miles" | "vehicle_actual_expenses">,
  loggedMiles = 0,
): { miles: number; deduction: number; method: string } {
  if (p.vehicle_method === "actual") {
    return { miles: 0, deduction: round(p.vehicle_actual_expenses), method: "Actual expenses" };
  }
  const businessMiles = clamp0((p.vehicle_total_miles - p.vehicle_commute_miles)) + loggedMiles;
  return {
    miles: businessMiles,
    deduction: round(businessMiles * STANDARD_MILEAGE_RATE),
    method: "Standard mileage",
  };
}

export function homeOfficeDeduction(p: Pick<TaxProfile,
  "has_home_office" | "home_office_sqft" | "home_total_sqft" | "home_office_use_simplified" |
  "home_rent_mortgage_year" | "home_utilities_year" | "home_insurance_year" | "home_repairs_year">,
): { deduction: number; method: string; businessPct: number } {
  if (!p.has_home_office || p.home_office_sqft <= 0) {
    return { deduction: 0, method: "—", businessPct: 0 };
  }
  const businessPct = p.home_total_sqft > 0 ? p.home_office_sqft / p.home_total_sqft : 0;
  if (p.home_office_use_simplified) {
    const sqft = Math.min(p.home_office_sqft, HOME_OFFICE_SIMPLIFIED_MAX_SQFT);
    return {
      deduction: round(sqft * HOME_OFFICE_SIMPLIFIED_RATE),
      method: "Simplified ($5/sq ft)",
      businessPct,
    };
  }
  const totalHome = p.home_rent_mortgage_year + p.home_utilities_year +
    p.home_insurance_year + p.home_repairs_year;
  return {
    deduction: round(totalHome * businessPct),
    method: "Actual expenses",
    businessPct,
  };
}

// ---------------------------------------------------------------------------
// Self-employment tax (Schedule SE)
// ---------------------------------------------------------------------------
export type SEResult = {
  netEarnings: number; // 92.35% of net profit
  socialSecurity: number;
  medicare: number;
  additionalMedicare: number;
  total: number;
  halfDeduction: number; // adjustment to income
};

export function selfEmploymentTax(netProfit: number, filing: FilingStatus, otherWages = 0): SEResult {
  if (netProfit <= 0) {
    return { netEarnings: 0, socialSecurity: 0, medicare: 0, additionalMedicare: 0, total: 0, halfDeduction: 0 };
  }
  const netEarnings = netProfit * SE_EARNINGS_FACTOR;
  const ssBase = clamp0(Math.min(netEarnings, SS_WAGE_BASE_2025 - otherWages));
  const socialSecurity = ssBase * SE_SS_RATE;
  const medicare = netEarnings * SE_MEDICARE_RATE;
  const overThreshold = clamp0(netEarnings + otherWages - ADDL_MEDICARE_THRESHOLD[filing]);
  const additionalMedicare = Math.min(netEarnings, overThreshold) * ADDL_MEDICARE_RATE;
  const total = socialSecurity + medicare + additionalMedicare;
  return {
    netEarnings: round(netEarnings),
    socialSecurity: round(socialSecurity),
    medicare: round(medicare),
    additionalMedicare: round(additionalMedicare),
    total: round(total),
    halfDeduction: round((socialSecurity + medicare) / 2),
  };
}

// ---------------------------------------------------------------------------
// Income tax + QBI + full liability projection
// ---------------------------------------------------------------------------
export function ordinaryIncomeTax(taxableIncome: number, filing: FilingStatus): number {
  let remaining = clamp0(taxableIncome);
  let lastCap = 0;
  let tax = 0;
  for (const b of BRACKETS[filing]) {
    const slice = Math.min(remaining, b.upTo - lastCap);
    if (slice <= 0) break;
    tax += slice * b.rate;
    remaining -= slice;
    lastCap = b.upTo;
  }
  return round(tax);
}

export function marginalRate(taxableIncome: number, filing: FilingStatus): number {
  let lastCap = 0;
  for (const b of BRACKETS[filing]) {
    if (taxableIncome <= b.upTo) return b.rate;
    lastCap = b.upTo;
  }
  return 0.37;
}

export type LiabilityResult = {
  netProfit: number;
  se: SEResult;
  qbiDeduction: number;
  adjustedGrossIncome: number;
  standardOrItemized: number;
  taxableIncome: number;
  incomeTax: number;
  selfEmploymentTax: number;
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
};

export function projectLiability(netProfit: number, p: TaxProfile): LiabilityResult {
  const filing = p.filing_status;
  const se = selfEmploymentTax(netProfit, filing, p.spouse_w2_income);

  // Adjustments to income (above-the-line)
  const adjustments =
    se.halfDeduction +
    p.sep_simple_401k_contrib +
    p.health_insurance_premium +
    p.hsa_contribution;

  const businessIncomeAfterAdj = clamp0(netProfit - se.halfDeduction);
  const householdIncome = netProfit + p.spouse_w2_income + p.other_household_income;
  const agi = clamp0(householdIncome - adjustments);

  const deduction = p.use_itemized
    ? Math.max(p.itemized_deductions, 0)
    : STANDARD_DEDUCTION[filing];

  // QBI: 20% of the lesser of qualified business income or (taxable income before QBI)
  const taxableBeforeQbi = clamp0(agi - deduction);
  const qbiBase = Math.min(clamp0(businessIncomeAfterAdj), taxableBeforeQbi);
  const qbiDeduction = round(qbiBase * QBI_RATE);

  const taxableIncome = clamp0(taxableBeforeQbi - qbiDeduction);
  const incomeTax = ordinaryIncomeTax(taxableIncome, filing);
  const totalTax = round(incomeTax + se.total);
  const effectiveRate = householdIncome > 0 ? totalTax / householdIncome : 0;

  return {
    netProfit: round(netProfit),
    se,
    qbiDeduction,
    adjustedGrossIncome: round(agi),
    standardOrItemized: round(deduction),
    taxableIncome: round(taxableIncome),
    incomeTax,
    selfEmploymentTax: se.total,
    totalTax,
    effectiveRate,
    marginalRate: marginalRate(taxableIncome, filing),
  };
}

// ---------------------------------------------------------------------------
// Quarterly estimated taxes (safe harbor)
// ---------------------------------------------------------------------------
export type EstimateResult = {
  projectedTotalTax: number;
  safeHarborTax: number;       // the lower required-annual-payment target
  safeHarborBasis: string;     // which rule applied
  requiredAnnual: number;      // what you must pay in to avoid penalty
  perQuarter: number;
  stateAnnual: number;
  statePerQuarter: number;
};

export function quarterlyEstimates(liability: LiabilityResult, p: TaxProfile): EstimateResult {
  const projected = liability.totalTax;
  const ninetyCurrent = projected * 0.9;

  // 110% of prior-year tax if prior AGI > $150k ($75k MFS), else 100%.
  const highIncome = p.prior_year_agi > (p.filing_status === "mfs" ? 75_000 : 150_000);
  const priorPct = p.safe_harbor_target / 100 || (highIncome ? 1.1 : 1.0);
  const priorYearSafe = p.prior_year_total_tax * priorPct;

  let safeHarborTax: number;
  let basis: string;
  if (p.prior_year_total_tax > 0 && priorYearSafe < ninetyCurrent) {
    safeHarborTax = priorYearSafe;
    basis = `${Math.round(priorPct * 100)}% of last year's tax`;
  } else {
    safeHarborTax = ninetyCurrent;
    basis = "90% of this year's projected tax";
  }

  const stateAnnual = p.pay_state_estimates
    ? round(liability.taxableIncome * p.state_tax_rate)
    : 0;

  return {
    projectedTotalTax: round(projected),
    safeHarborTax: round(safeHarborTax),
    safeHarborBasis: basis,
    requiredAnnual: round(safeHarborTax),
    perQuarter: round(safeHarborTax / 4),
    stateAnnual,
    statePerQuarter: round(stateAnnual / 4),
  };
}

// ---------------------------------------------------------------------------
// Depreciation (simple straight-line / Section 179 helper for the asset list)
// ---------------------------------------------------------------------------
export function firstYearDepreciation(asset: {
  cost: number;
  business_use_pct: number;
  recovery_years: number;
  section_179: boolean;
  bonus_depreciation: boolean;
}): number {
  const basis = asset.cost * (asset.business_use_pct / 100);
  if (asset.section_179 || asset.bonus_depreciation) return round(basis);
  // Half-year convention straight-line approximation for year 1.
  const years = asset.recovery_years > 0 ? asset.recovery_years : 7;
  return round((basis / years) * 0.5);
}

import { requireAdmin } from "@/lib/auth";
import { getTaxProfile } from "@/lib/tax-data";
import { saveTaxProfile } from "@/lib/actions/tax";
import { PageHeader, Card, Field, SectionTitle, Alert } from "@/components/ui";
import { ENTITY_TYPES, FILING_STATUSES } from "@/lib/constants";
import type { TaxProfile } from "@/lib/database.types";

export const dynamic = "force-dynamic";

function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 transition hover:border-brand-200">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
      </span>
    </label>
  );
}

function Money({ name, label, hint, value }: { name: string; label: string; hint?: string; value: number }) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
        <input type="number" step="0.01" name={name} defaultValue={value || ""} className="input pl-7" placeholder="0.00" />
      </div>
    </Field>
  );
}

export default async function TaxProfilePage({ searchParams }: { searchParams: { saved?: string } }) {
  await requireAdmin();
  const p: TaxProfile = await getTaxProfile();

  return (
    <div className="pb-10">
      <PageHeader
        title="Business & Tax Profile"
        subtitle="Answer once. Every estimate, form, and quarterly payment uses these answers."
        backHref="/accounting/tax"
      />

      {searchParams.saved && (
        <div className="mb-5">
          <Alert tone="green" title="Saved">Your tax profile is updated. Head to the Tax Center to see the new numbers.</Alert>
        </div>
      )}

      <Alert tone="amber" title="Why we ask for so much">
        Tax software fails owners by asking too little, too late. We collect everything up front —
        even things that seem tiny now — so nothing is missed in April. Leave a box blank if it
        doesn&apos;t apply; it&apos;ll just count as zero.
      </Alert>

      <form action={saveTaxProfile} className="mt-6 space-y-5">
        {/* ENTITY & IDENTITY */}
        <Card>
          <SectionTitle>1 · Business identity</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="How is the business taxed?" hint="Most one-owner shops are a sole prop or single-member LLC — both file Schedule C.">
              <select name="entity_type" defaultValue={p.entity_type} className="input">
                {Object.entries(ENTITY_TYPES).map(([v, e]) => (
                  <option key={v} value={v}>{e.label} — {e.form}</option>
                ))}
              </select>
            </Field>
            <Field label="Business start date" hint="When you first opened for business.">
              <input type="date" name="business_start_date" defaultValue={p.business_start_date ?? ""} className="input" />
            </Field>
            <Field label="Legal business name" hint="The name on your tax filings (often your own name for a sole prop).">
              <input name="legal_business_name" defaultValue={p.legal_business_name ?? ""} className="input" />
            </Field>
            <Field label="DBA / trade name" hint='The name customers see, e.g. "Joe&apos;s Garage".'>
              <input name="dba_name" defaultValue={p.dba_name ?? ""} className="input" />
            </Field>
            <Field label="Federal EIN" hint="Employer ID Number (##-#######). Sole props without employees can use their SSN instead.">
              <input name="ein" defaultValue={p.ein ?? ""} className="input" placeholder="12-3456789" />
            </Field>
            <Field label="Owner SSN (last 4 only)" hint="For your reference on the file. We never store the full number.">
              <input name="owner_ssn_last4" defaultValue={p.owner_ssn_last4 ?? ""} maxLength={4} className="input" placeholder="1234" />
            </Field>
            <Field label="Principal business code (NAICS)" hint="811111 = General Automotive Repair. Goes on Schedule C line B.">
              <input name="naics_code" defaultValue={p.naics_code ?? ""} className="input" />
            </Field>
            <Field label="Business description" hint="Schedule C line A.">
              <input name="business_description" defaultValue={p.business_description ?? ""} className="input" />
            </Field>
          </div>
        </Card>

        {/* ACCOUNTING METHOD & COMPLIANCE QUESTIONS */}
        <Card>
          <SectionTitle>2 · Bookkeeping & compliance</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Accounting method" hint="Cash = count income when paid (most shops). Accrual = count when invoiced.">
              <select name="accounting_method" defaultValue={p.accounting_method} className="input">
                <option value="cash">Cash basis</option>
                <option value="accrual">Accrual basis</option>
              </select>
            </Field>
            <Field label="State you operate in" hint="Drives state filing reminders.">
              <input name="state_of_operation" defaultValue={p.state_of_operation ?? ""} className="input" placeholder="TX" maxLength={2} />
            </Field>
            <Field label="State sales-tax ID">
              <input name="state_tax_id" defaultValue={p.state_tax_id ?? ""} className="input" />
            </Field>
            <Field label="State unemployment ID" hint="Only if you have employees.">
              <input name="state_unemployment_id" defaultValue={p.state_unemployment_id ?? ""} className="input" />
            </Field>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Check name="materially_participates" label="I materially participate in the business" hint="You run the day-to-day. Schedule C line G — almost always yes for an owner-operator." defaultChecked={p.materially_participates} />
            <Check name="first_year_filing" label="This is my first year in business" hint="Unlocks startup-cost write-offs (up to $5,000) we'll remind you about." defaultChecked={p.first_year_filing} />
            <Check name="has_employees" label="I have W-2 employees" hint="If yes, you'll owe payroll tax filings (940/941) — flagged for you." defaultChecked={p.has_employees} />
            <Check name="made_payments_req_1099" label="I paid any contractor $600+ this year" hint="Schedule C lines I & J. If yes, manage them under 1099 Contractors." defaultChecked={!!p.made_payments_req_1099} />
          </div>
        </Card>

        {/* OWNER & HOUSEHOLD */}
        <Card>
          <SectionTitle>3 · Owner & household</SectionTitle>
          <p className="-mt-1 mb-4 text-sm text-slate-500">Your personal return and the business flow together. This makes the income-tax estimate accurate instead of a guess.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Owner full name">
              <input name="owner_full_name" defaultValue={p.owner_full_name ?? ""} className="input" />
            </Field>
            <Field label="Filing status" hint="How you file your personal 1040.">
              <select name="filing_status" defaultValue={p.filing_status} className="input">
                {Object.entries(FILING_STATUSES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Spouse name" hint="If filing jointly.">
              <input name="spouse_name" defaultValue={p.spouse_name ?? ""} className="input" />
            </Field>
            <Field label="Number of dependents" hint="Children/others you claim — affects credits.">
              <input type="number" name="dependents" defaultValue={p.dependents || ""} className="input" placeholder="0" />
            </Field>
            <Money name="spouse_w2_income" label="Spouse W-2 wages" hint="Pushes your household into higher brackets — we account for it." value={p.spouse_w2_income} />
            <Money name="other_household_income" label="Other household income" hint="Interest, a second job, rental income, etc." value={p.other_household_income} />
            <Money name="prior_year_agi" label="Last year's AGI" hint="Adjusted Gross Income from last year's 1040. Sets your safe-harbor target." value={p.prior_year_agi} />
            <Money name="prior_year_total_tax" label="Last year's total tax" hint="Total tax line from last year's 1040 — the safest base for this year's estimates." value={p.prior_year_total_tax} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Check name="use_itemized" label="I itemize deductions" hint="Leave off to use the standard deduction (best for most people)." defaultChecked={p.use_itemized} />
            <Money name="itemized_deductions" label="Itemized deduction total" hint="Only if itemizing — mortgage interest, SALT, charity, etc." value={p.itemized_deductions} />
          </div>
        </Card>

        {/* SELF-EMPLOYED PERKS */}
        <Card>
          <SectionTitle>4 · Self-employed deductions owners forget</SectionTitle>
          <p className="-mt-1 mb-4 text-sm text-slate-500">These come straight off your income before tax. Most owners leave thousands here unclaimed.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Money name="health_insurance_premium" label="Health insurance premiums" hint="Self-employed health insurance for you/family is deductible." value={p.health_insurance_premium} />
            <Money name="sep_simple_401k_contrib" label="Retirement contributions" hint="SEP-IRA, SIMPLE, or Solo 401(k) — a top shelter for shop owners." value={p.sep_simple_401k_contrib} />
            <Money name="hsa_contribution" label="HSA contributions" hint="If you have a high-deductible health plan." value={p.hsa_contribution} />
          </div>
        </Card>

        {/* HOME OFFICE */}
        <Card>
          <SectionTitle>5 · Home office</SectionTitle>
          <div className="mb-4">
            <Check name="has_home_office" label="I use part of my home regularly & exclusively for the business" hint="Even doing the books and scheduling from a spare room can qualify (Form 8829)." defaultChecked={p.has_home_office} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Office square feet" hint="The dedicated business area.">
              <input type="number" name="home_office_sqft" defaultValue={p.home_office_sqft || ""} className="input" placeholder="0" />
            </Field>
            <Field label="Total home square feet">
              <input type="number" name="home_total_sqft" defaultValue={p.home_total_sqft || ""} className="input" placeholder="0" />
            </Field>
            <Field label="Method" hint="Simplified = $5/sq ft (max $1,500), no receipts needed.">
              <select name="home_office_use_simplified" defaultValue={p.home_office_use_simplified ? "true" : ""} className="input">
                <option value="true">Simplified ($5/sq ft)</option>
                <option value="">Actual expenses</option>
              </select>
            </Field>
            <div />
            <Money name="home_rent_mortgage_year" label="Annual rent or mortgage interest" hint="Actual method only." value={p.home_rent_mortgage_year} />
            <Money name="home_utilities_year" label="Annual utilities" value={p.home_utilities_year} />
            <Money name="home_insurance_year" label="Annual home insurance" value={p.home_insurance_year} />
            <Money name="home_repairs_year" label="Annual repairs/maintenance" value={p.home_repairs_year} />
          </div>
        </Card>

        {/* VEHICLE */}
        <Card>
          <SectionTitle>6 · Business vehicle</SectionTitle>
          <p className="-mt-1 mb-4 text-sm text-slate-500">Parts runs, tows, customer drop-offs — those miles are deductible. Log individual trips under Mileage Log; set the method here.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Vehicle description">
              <input name="vehicle_description" defaultValue={p.vehicle_description ?? ""} className="input" placeholder="2019 Ford F-150" />
            </Field>
            <Field label="Date placed in service">
              <input type="date" name="vehicle_in_service_date" defaultValue={p.vehicle_in_service_date ?? ""} className="input" />
            </Field>
            <Field label="Deduction method" hint="Standard mileage is simpler and usually wins for light trucks.">
              <select name="vehicle_method" defaultValue={p.vehicle_method} className="input">
                <option value="standard">Standard mileage (70¢/mi)</option>
                <option value="actual">Actual expenses</option>
              </select>
            </Field>
            <Field label="Total miles driven (year)" hint="All miles, business + personal.">
              <input type="number" name="vehicle_total_miles" defaultValue={p.vehicle_total_miles || ""} className="input" placeholder="0" />
            </Field>
            <Field label="Commuting / personal miles" hint="Subtracted out — only business miles deduct.">
              <input type="number" name="vehicle_commute_miles" defaultValue={p.vehicle_commute_miles || ""} className="input" placeholder="0" />
            </Field>
            <Money name="vehicle_actual_expenses" label="Actual vehicle expenses" hint="Gas, repairs, insurance, depreciation — actual method only." value={p.vehicle_actual_expenses} />
          </div>
          <div className="mt-4">
            <Check name="vehicle_has_another" label="I have another vehicle available for personal use" hint="A common IRS question (Schedule C line 47b)." defaultChecked={p.vehicle_has_another} />
          </div>
        </Card>

        {/* ESTIMATES & STATE */}
        <Card>
          <SectionTitle>7 · Estimated-tax strategy</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Safe-harbor target" hint="The cushion that avoids underpayment penalties. 110% if last year's AGI was over $150k.">
              <select name="safe_harbor_target" defaultValue={String(p.safe_harbor_target)} className="input">
                <option value="90">90% of this year (minimum)</option>
                <option value="100">100% of last year (safe)</option>
                <option value="110">110% of last year (high earners)</option>
              </select>
            </Field>
            <Field label="State estimated tax rate (%)" hint="Approximate flat rate for state estimate. Leave 0 if your state has no income tax.">
              <input type="number" step="0.01" name="state_tax_rate_pct" defaultValue={p.state_tax_rate ? p.state_tax_rate * 100 : ""} className="input" placeholder="0" />
            </Field>
            <div className="flex items-end">
              <Check name="pay_state_estimates" label="I also pay state estimated tax" defaultChecked={p.pay_state_estimates} />
            </div>
          </div>
          <Field label="Notes for your accountant" className="mt-4">
            <textarea name="notes" defaultValue={p.notes ?? ""} rows={3} className="input" placeholder="Anything unusual this year — a big equipment purchase, a new partner, sold a vehicle…" />
          </Field>
        </Card>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <button className="btn-primary shadow-lift">Save tax profile</button>
        </div>
      </form>
    </div>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTaxYearData } from "@/lib/tax-data";
import { getShopSettings } from "@/lib/queries";
import { PageHeader, Card, Alert, SectionTitle, Badge } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ENTITY_TYPES } from "@/lib/constants";
import { TAX_YEAR, estimatedDueDates } from "@/lib/tax";
import type { Vendor, Expense } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const THRESHOLD_1099 = 600;

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium tabular-nums text-slate-800">{value}</span>
    </div>
  );
}

export default async function TaxPacketPage({ searchParams }: { searchParams: { year?: string } }) {
  await requireAdmin();
  const year = parseInt(searchParams.year ?? `${TAX_YEAR}`, 10);
  const supabase = createClient();

  const [d, shop, { data: vendorData }, { data: expData }] = await Promise.all([
    getTaxYearData(year),
    getShopSettings(),
    supabase.from("vendors").select("*").order("name"),
    supabase
      .from("expenses")
      .select("vendor_id, amount, payment_method")
      .gte("expense_date", `${year}-01-01`)
      .lte("expense_date", `${year}-12-31`),
  ]);

  const { profile, scheduleC: c, liability, estimate } = d;
  const entity = ENTITY_TYPES[profile.entity_type];

  // --- 1099 reportability (mirrors the Contractors page logic) ---
  const vendors = (vendorData as Vendor[]) ?? [];
  const expenses = (expData as Pick<Expense, "vendor_id" | "amount" | "payment_method">[]) ?? [];
  const paidByVendor = new Map<string, number>();
  for (const e of expenses) {
    if (!e.vendor_id || e.payment_method === "card") continue;
    paidByVendor.set(e.vendor_id, (paidByVendor.get(e.vendor_id) ?? 0) + e.amount);
  }
  const reportable = vendors.filter((v) => v.is_1099 && (paidByVendor.get(v.id) ?? 0) >= THRESHOLD_1099);
  const missing1099 = reportable.filter((v) => !v.tax_id || !v.w9_on_file);
  const suggested1099 = vendors.filter((v) => !v.is_1099 && (paidByVendor.get(v.id) ?? 0) >= THRESHOLD_1099);

  // --- Readiness gaps: the things to fix before handing this off ---
  const gaps: { label: string; href: string }[] = [];
  if (!profile.ein && profile.entity_type !== "sole_prop")
    gaps.push({ label: "Business EIN not entered", href: "/accounting/tax/profile" });
  if (!profile.owner_full_name && !shop?.legal_name)
    gaps.push({ label: "Proprietor / legal name not set", href: "/accounting/tax/profile" });
  if (profile.prior_year_total_tax <= 0)
    gaps.push({ label: "Last year's total tax not entered (drives safe-harbor)", href: "/accounting/tax/profile" });
  if (c.totalExpenses <= 0)
    gaps.push({ label: "No categorized expenses for this year yet", href: "/accounting" });
  if (profile.has_home_office && profile.home_office_sqft <= 0)
    gaps.push({ label: "Home office is claimed but not measured", href: "/accounting/tax/profile" });
  if (missing1099.length > 0)
    gaps.push({ label: `${missing1099.length} contractor(s) over $600 missing a W-9 / tax ID`, href: "/accounting/tax/contractors" });
  if (suggested1099.length > 0)
    gaps.push({ label: `${suggested1099.length} vendor(s) paid $600+ not yet reviewed for a 1099`, href: "/accounting/tax/contractors" });

  const preparedOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const partII = c.lines.filter((l) => l.amount !== 0);

  return (
    <div>
      <PageHeader
        title={`Tax Packet · ${year}`}
        subtitle="One printable handoff with everything your preparer needs"
        backHref="/accounting/tax"
        actions={<PrintButton label="Print / Save PDF" />}
      />

      <div className="mb-5 print:hidden">
        <Alert tone={gaps.length === 0 ? "green" : "amber"} title={gaps.length === 0 ? "Ready to hand off" : `${gaps.length} item(s) to finish first`}>
          {gaps.length === 0 ? (
            <>Everything below is complete. Print to PDF and send it to your tax preparer — or keep it for your records.</>
          ) : (
            <>This packet still prints, but a few inputs are missing. Fixing them makes the numbers final:
              <ul className="mt-2 space-y-1">
                {gaps.map((g) => (
                  <li key={g.label}>
                    <Link href={g.href} className="font-semibold underline">{g.label}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Alert>
      </div>

      <Card>
        {/* Cover / identity */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{shop?.shop_name || "Joe's Garage"}</h2>
              <p className="text-sm text-slate-500">Tax year {year} · files as {entity.form}</p>
            </div>
            <div className="text-right text-xs text-slate-400">Prepared {preparedOn}</div>
          </div>
          <div className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            <KV label="Proprietor" value={profile.owner_full_name || shop?.legal_name || "—"} />
            <KV label="EIN" value={profile.ein || "—"} />
            <KV label="Business (Sch. C line A)" value={profile.business_description || "—"} />
            <KV label="NAICS code (line B)" value={profile.naics_code || "—"} />
            <KV label="Entity type" value={entity.label} />
            <KV label="Accounting method" value={<span className="capitalize">{profile.accounting_method}</span>} />
          </div>
        </div>

        {/* Income */}
        <div className="mt-5">
          <SectionTitle>Income</SectionTitle>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <KV label="Gross receipts (sales tax removed)" value={formatCurrency(c.grossReceipts)} />
            <KV label="Sales tax collected (excluded from income)" value={formatCurrency(d.salesTaxCollected)} />
            <KV label="Cost of goods sold" value={formatCurrency(c.cogs)} />
            <KV label="Outstanding A/R (not yet collected)" value={formatCurrency(d.outstandingAR)} />
          </div>
        </div>

        {/* Schedule C summary */}
        <div className="mt-5">
          <SectionTitle>Schedule C summary</SectionTitle>
          {partII.length === 0 ? (
            <p className="py-2 text-sm text-slate-400">No categorized expenses yet for {year}.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {partII.map((l) => (
                  <tr key={l.code}>
                    <td className="w-12 py-1 align-top font-mono text-xs text-slate-400">{l.line}</td>
                    <td className="py-1 pr-4 text-slate-700">{l.label}</td>
                    <td className="py-1 text-right tabular-nums text-slate-800">{formatCurrency(l.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 font-semibold">
                  <td className="py-1 font-mono text-xs text-slate-400">28</td>
                  <td className="py-1 text-slate-700">Total expenses</td>
                  <td className="py-1 text-right tabular-nums text-slate-800">{formatCurrency(c.totalExpenses)}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-1 font-mono text-xs text-slate-400">30</td>
                  <td className="py-1 text-slate-700">Home office (Form 8829)</td>
                  <td className="py-1 text-right tabular-nums text-slate-800">{formatCurrency(c.homeOffice)}</td>
                </tr>
                <tr className="border-t border-slate-300 text-base font-bold">
                  <td className="py-1.5 font-mono text-xs text-slate-400">31</td>
                  <td className="py-1.5 text-slate-900">Net profit / (loss)</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-900">{formatCurrency(c.netProfit)}</td>
                </tr>
              </tbody>
            </table>
          )}
          <Link href={`/accounting/tax/schedule-c?year=${year}`} className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline print:hidden">
            Full Schedule C detail →
          </Link>
        </div>

        {/* Projected tax */}
        <div className="mt-5">
          <SectionTitle>Projected federal tax</SectionTitle>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <KV label="Self-employment tax" value={formatCurrency(liability.selfEmploymentTax)} />
            <KV label="QBI deduction (§199A)" value={formatCurrency(liability.qbiDeduction)} />
            <KV label="Taxable income" value={formatCurrency(liability.taxableIncome)} />
            <KV label="Income tax" value={formatCurrency(liability.incomeTax)} />
            <KV label="Total projected tax" value={formatCurrency(liability.totalTax)} />
            <KV label="Effective rate" value={formatPercent(liability.effectiveRate)} />
          </div>
        </div>

        {/* Estimated payments */}
        <div className="mt-5">
          <SectionTitle>Estimated payments ({year})</SectionTitle>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <KV label="Required for the year (safe harbor)" value={formatCurrency(estimate.requiredAnnual)} />
            <KV label="Per quarter" value={formatCurrency(estimate.perQuarter)} />
            <KV label="Paid so far (federal)" value={formatCurrency(d.paidFederal)} />
            <KV label="Remaining" value={formatCurrency(Math.max(estimate.requiredAnnual - d.paidFederal, 0))} />
          </div>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {estimatedDueDates(year).map((q) => {
                const paid = d.estimatedPayments
                  .filter((p) => p.quarter === q.quarter && p.jurisdiction === "federal")
                  .reduce((s, p) => s + p.amount, 0);
                return (
                  <tr key={q.quarter}>
                    <td className="py-1 text-slate-600">{q.label} · due {q.due}</td>
                    <td className="py-1 text-right tabular-nums text-slate-700">{formatCurrency(estimate.perQuarter)}</td>
                    <td className="py-1 pl-3 text-right">{paid > 0 ? <Badge tone="green">paid {formatCurrency(paid)}</Badge> : <span className="text-xs text-slate-400">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 1099 contractors */}
        <div className="mt-5">
          <SectionTitle>1099-NEC contractors</SectionTitle>
          {reportable.length === 0 ? (
            <p className="py-1 text-sm text-slate-400">No contractors reach the $600 reporting threshold for {year}.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {reportable.map((v) => (
                  <tr key={v.id}>
                    <td className="py-1 text-slate-700">{v.legal_name || v.name}</td>
                    <td className="py-1 text-slate-500">{v.tax_id ? `ID ${v.tax_id}` : <span className="text-red-600">tax ID missing</span>}</td>
                    <td className="py-1 text-right tabular-nums text-slate-800">{formatCurrency(paidByVendor.get(v.id) ?? 0)}</td>
                    <td className="py-1 pl-3 text-right">{v.w9_on_file ? <Badge tone="green">W-9</Badge> : <Badge tone="red">no W-9</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {suggested1099.length > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Review: {suggested1099.map((v) => v.name).join(", ")} paid $600+ but not marked as contractors.
            </p>
          )}
        </div>

        {/* Vehicle & depreciation */}
        <div className="mt-5">
          <SectionTitle>Vehicle & equipment</SectionTitle>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <KV label={`Business mileage (${d.vehicle.method})`} value={`${d.loggedBusinessMiles.toLocaleString()} mi`} />
            <KV label="Vehicle deduction (line 9)" value={formatCurrency(d.vehicle.deduction)} />
            <KV label="Equipment depreciation (line 13)" value={formatCurrency(d.depreciation)} />
          </div>
        </div>

        <p className="mt-6 border-t border-slate-200 pt-3 text-xs text-slate-400">
          Generated from {shop?.shop_name || "the shop"}&apos;s records under 2025 IRS rules. These are
          planning estimates — have a CPA or enrolled agent confirm before filing.
        </p>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getTaxYearData } from "@/lib/tax-data";
import { getShopSettings } from "@/lib/queries";
import { PageHeader, Card, Alert, SectionTitle } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { formatCurrency } from "@/lib/format";
import { ENTITY_TYPES } from "@/lib/constants";
import { TAX_YEAR } from "@/lib/tax";

export const dynamic = "force-dynamic";

function Line({ no, label, amount, bold, hint }: { no: string; label: string; amount: number; bold?: boolean; hint?: string }) {
  return (
    <tr className={bold ? "border-t border-slate-200 font-semibold" : ""}>
      <td className="w-12 py-1.5 align-top text-xs font-mono text-slate-400">{no}</td>
      <td className="py-1.5 pr-4 align-top text-slate-700">
        {label}
        {hint && <span className="block text-xs font-normal text-slate-400">{hint}</span>}
      </td>
      <td className="py-1.5 text-right align-top tabular-nums text-slate-800">{formatCurrency(amount)}</td>
    </tr>
  );
}

export default async function ScheduleCPage({ searchParams }: { searchParams: { year?: string } }) {
  await requireAdmin();
  const year = parseInt(searchParams.year ?? `${TAX_YEAR}`, 10);
  const [d, shop] = await Promise.all([getTaxYearData(year), getShopSettings()]);
  const { profile, scheduleC: c } = d;
  const entity = ENTITY_TYPES[profile.entity_type];
  const thisYear = new Date().getFullYear();
  const years = [thisYear, thisYear - 1, thisYear - 2];

  const partII = c.lines.filter((l) => l.amount !== 0);

  return (
    <div>
      <PageHeader
        title={`Schedule C · ${year}`}
        subtitle={`Profit or Loss From Business — auto-filled for ${entity.label}`}
        backHref="/accounting/tax"
        actions={<PrintButton label="Print Schedule C" />}
      />

      <div className="mb-4 flex gap-2 print:hidden">
        {years.map((y) => (
          <Link key={y} href={`/accounting/tax/schedule-c?year=${y}`} className={`rounded-full px-3 py-1 text-sm ${y === year ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
            {y}
          </Link>
        ))}
      </div>

      <div className="mb-5 print:hidden">
        <Alert tone="blue" title="This is your real Schedule C, filled in">
          Hand this to your tax preparer or copy it straight onto Form 1040 Schedule C. Numbers come
          from your {profile.accounting_method === "cash" ? "collected payments" : "invoiced totals"}{" "}
          and categorized expenses. Sales tax collected is correctly excluded from income.
        </Alert>
      </div>

      <Card>
        {/* Header block mimicking the form */}
        <div className="mb-4 border-b border-slate-200 pb-4">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div><span className="text-slate-400">Proprietor:</span> <span className="font-medium text-slate-700">{profile.owner_full_name || shop?.legal_name || "—"}</span></div>
            <div><span className="text-slate-400">EIN:</span> <span className="font-medium text-slate-700">{profile.ein || "—"}</span></div>
            <div><span className="text-slate-400">Business (line A):</span> <span className="font-medium text-slate-700">{profile.business_description || "—"}</span></div>
            <div><span className="text-slate-400">Code (line B):</span> <span className="font-medium text-slate-700">{profile.naics_code || "—"}</span></div>
            <div><span className="text-slate-400">Business name (line C):</span> <span className="font-medium text-slate-700">{profile.dba_name || shop?.shop_name || "—"}</span></div>
            <div><span className="text-slate-400">Method (line F):</span> <span className="font-medium capitalize text-slate-700">{profile.accounting_method}</span></div>
          </div>
        </div>

        <SectionTitle>Part I · Income</SectionTitle>
        <table className="w-full text-sm">
          <tbody>
            <Line no="1" label="Gross receipts or sales" amount={c.grossReceipts} hint="Collected revenue, sales tax removed" />
            <Line no="2" label="Returns and allowances" amount={c.returnsAllowances} />
            <Line no="4" label="Cost of goods sold (from Part III)" amount={c.cogs} />
            <Line no="7" label="Gross profit / gross income" amount={c.grossProfit} bold />
          </tbody>
        </table>

        <div className="mt-6">
          <SectionTitle>Part II · Expenses</SectionTitle>
          {partII.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No categorized expenses yet for {year}. Add them under Accounting and they&apos;ll land on the right line automatically.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {partII.map((l) => (
                  <Line key={l.code} no={l.line} label={l.label} amount={l.amount} />
                ))}
                <Line no="28" label="Total expenses" amount={c.totalExpenses} bold />
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6">
          <table className="w-full text-sm">
            <tbody>
              <Line no="29" label="Tentative profit (line 7 − line 28)" amount={c.tentativeProfit} bold />
              <Line no="30" label="Expenses for business use of home (Form 8829)" amount={c.homeOffice} hint={d.homeOffice.method !== "—" ? d.homeOffice.method : undefined} />
              <Line no="31" label="Net profit or (loss) — flows to Schedule 1 & Schedule SE" amount={c.netProfit} bold />
            </tbody>
          </table>
        </div>

        {/* Part III & IV supporting detail */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Part IV · Vehicle</p>
            {d.vehicle.deduction > 0 ? (
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Method</dt><dd className="text-slate-700">{d.vehicle.method}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Business miles</dt><dd className="tabular-nums text-slate-700">{d.vehicle.miles.toLocaleString()}</dd></div>
                <div className="flex justify-between font-medium"><dt className="text-slate-600">Deduction (line 9)</dt><dd className="tabular-nums text-slate-800">{formatCurrency(d.vehicle.deduction)}</dd></div>
              </dl>
            ) : (
              <p className="text-sm text-slate-400">No vehicle deduction yet. Set a method in your profile and log miles.</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Line 13 · Depreciation</p>
            {d.depreciation > 0 ? (
              <p className="text-sm text-slate-700">
                <span className="font-medium tabular-nums">{formatCurrency(d.depreciation)}</span> from equipment purchases this year (Form 4562).
              </p>
            ) : (
              <p className="text-sm text-slate-400">No depreciable assets recorded for {year}.</p>
            )}
            <Link href="/accounting/tax/assets" className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline print:hidden">Manage equipment →</Link>
          </div>
        </div>
      </Card>

      <div className="mt-5 print:hidden">
        <Alert tone="amber">
          This Schedule C is a preparation aid generated from your records under 2025 rules. Have a
          CPA or enrolled agent review before filing — especially in your first year or after big
          purchases.
        </Alert>
      </div>
    </div>
  );
}

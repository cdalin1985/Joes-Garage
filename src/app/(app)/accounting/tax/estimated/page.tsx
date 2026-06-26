import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getTaxYearData } from "@/lib/tax-data";
import { addEstimatedPayment, deleteEstimatedPayment } from "@/lib/actions/tax";
import { PageHeader, Card, Stat, SectionTitle, Alert, Field, DataTable, EmptyState } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { estimatedDueDates, TAX_YEAR } from "@/lib/tax";

export const dynamic = "force-dynamic";

export default async function EstimatedTaxPage({ searchParams }: { searchParams: { year?: string } }) {
  await requireAdmin();
  const year = parseInt(searchParams.year ?? `${TAX_YEAR}`, 10);
  const d = await getTaxYearData(year);
  const { estimate, liability } = d;
  const due = estimatedDueDates(year);

  const remainingFed = Math.max(estimate.requiredAnnual - d.paidFederal, 0);
  const today = new Date().toISOString().slice(0, 10);
  const nextDue = due.find((q) => q.due >= today) ?? due[3];

  return (
    <div>
      <PageHeader
        title="Quarterly Estimated Taxes"
        subtitle={`${year} — pay as you earn so April is a non-event`}
        backHref="/accounting/tax"
      />

      <Alert tone="blue" title="Why you pay quarterly">
        As a business owner, no one withholds taxes from your pay — so the IRS asks for it four
        times a year. Pay at least <strong>{formatCurrency(estimate.requiredAnnual)}</strong> across
        the year ({estimate.safeHarborBasis}) and you&apos;re penalty-proof, even if you end up
        owing more.
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Projected total tax" value={formatCurrency(estimate.projectedTotalTax)} tone="amber" hint={`${formatCurrency(liability.incomeTax)} income + ${formatCurrency(liability.selfEmploymentTax)} SE`} />
        <Stat label="Safe-harbor target" value={formatCurrency(estimate.requiredAnnual)} tone="blue" hint={estimate.safeHarborBasis} />
        <Stat label="Per quarter" value={formatCurrency(estimate.perQuarter)} tone="blue" />
        <Stat label="Paid so far (federal)" value={formatCurrency(d.paidFederal)} tone={remainingFed > 0 ? "red" : "green"} hint={`${formatCurrency(remainingFed)} remaining`} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <SectionTitle>Schedule for {year}</SectionTitle>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="py-2">Quarter</th>
                <th className="py-2">Due</th>
                <th className="py-2 text-right">Federal target</th>
                {d.profile.pay_state_estimates && <th className="py-2 text-right">State</th>}
                <th className="py-2 text-right">Paid</th>
              </tr>
            </thead>
            <tbody>
              {due.map((q) => {
                const paid = d.estimatedPayments
                  .filter((p) => p.quarter === q.quarter && p.jurisdiction === "federal")
                  .reduce((s, p) => s + p.amount, 0);
                const isNext = q.quarter === nextDue.quarter;
                return (
                  <tr key={q.quarter} className={`border-t border-slate-100 ${isNext ? "bg-accent-50/40" : ""}`}>
                    <td className="py-2.5 font-medium text-slate-700">{q.label}{isNext && <span className="ml-2 text-[10px] font-bold uppercase text-brand-600">next</span>}</td>
                    <td className="py-2.5 text-slate-500">{formatDate(q.due)}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatCurrency(estimate.perQuarter)}</td>
                    {d.profile.pay_state_estimates && <td className="py-2.5 text-right tabular-nums text-slate-500">{formatCurrency(estimate.statePerQuarter)}</td>}
                    <td className="py-2.5 text-right tabular-nums font-medium text-emerald-600">{paid > 0 ? formatCurrency(paid) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-400">
            Pay federal online at IRS Direct Pay or EFTPS. Mail with Form 1040-ES vouchers if you prefer.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>Record a payment</SectionTitle>
          <form action={addEstimatedPayment} className="space-y-3">
            <input type="hidden" name="tax_year" value={year} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quarter">
                <select name="quarter" defaultValue={nextDue.quarter} className="input">
                  {due.map((q) => <option key={q.quarter} value={q.quarter}>{q.label} ({formatDate(q.due)})</option>)}
                </select>
              </Field>
              <Field label="Jurisdiction">
                <select name="jurisdiction" defaultValue="federal" className="input">
                  <option value="federal">Federal (IRS)</option>
                  <option value="state">State</option>
                </select>
              </Field>
              <Field label="Amount">
                <input type="number" step="0.01" name="amount" defaultValue={estimate.perQuarter || ""} className="input" required />
              </Field>
              <Field label="Date paid">
                <input type="date" name="paid_date" defaultValue={today} className="input" />
              </Field>
            </div>
            <Field label="Confirmation #" hint="From IRS Direct Pay / EFTPS">
              <input name="confirmation" className="input" />
            </Field>
            <button className="btn-primary w-full">Save payment</button>
          </form>
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle>Payment history</SectionTitle>
        {d.estimatedPayments.length === 0 ? (
          <EmptyState title="No estimated payments recorded yet" description="Log each quarterly payment so your year-end reconciliation is exact." />
        ) : (
          <DataTable head={<tr><th>Date</th><th>Year</th><th>Quarter</th><th>Jurisdiction</th><th>Confirmation</th><th className="text-right">Amount</th><th /></tr>}>
            {[...d.estimatedPayments].sort((a, b) => (b.paid_date ?? "").localeCompare(a.paid_date ?? "")).map((p) => (
              <tr key={p.id}>
                <td>{formatDate(p.paid_date)}</td>
                <td>{p.tax_year}</td>
                <td>Q{p.quarter}</td>
                <td className="capitalize">{p.jurisdiction}</td>
                <td className="text-slate-500">{p.confirmation || "—"}</td>
                <td className="text-right font-medium tabular-nums">{formatCurrency(p.amount)}</td>
                <td className="text-right"><DeleteButton action={deleteEstimatedPayment.bind(null, p.id)} iconOnly className="btn-ghost p-1.5" /></td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>

      <div className="mt-5">
        <Link href="/accounting/tax/profile" className="text-sm font-medium text-brand-600 hover:underline">Adjust your safe-harbor strategy →</Link>
      </div>
    </div>
  );
}

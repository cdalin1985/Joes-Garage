import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Stat, SectionTitle, Alert } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type PaymentRow = {
  amount: number;
  paid_at: string;
  invoices: { total: number; tax_amount: number } | null;
};
type ExpenseRow = {
  amount: number;
  tax_amount: number;
  expense_date: string;
  expense_categories: { name: string; schedule_c_line: string | null; tax_deductible: boolean } | null;
};

export default async function ReportsPage({ searchParams }: { searchParams: { year?: string } }) {
  await requireAdmin();
  const supabase = createClient();

  const year = parseInt(searchParams.year ?? `${new Date().getFullYear()}`, 10);
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const [{ data: payData }, { data: expData }, { data: arData }] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, paid_at, invoices(total, tax_amount)")
      .gte("paid_at", start)
      .lte("paid_at", end),
    supabase
      .from("expenses")
      .select("amount, tax_amount, expense_date, expense_categories(name, schedule_c_line, tax_deductible)")
      .gte("expense_date", start)
      .lte("expense_date", end),
    supabase.from("invoices").select("balance_due").not("status", "in", "(paid,void)"),
  ]);

  const payments = (payData as unknown as PaymentRow[]) ?? [];
  const expenses = (expData as unknown as ExpenseRow[]) ?? [];

  const monthlyIncome = Array(12).fill(0);
  const monthlyExpense = Array(12).fill(0);
  let income = 0;
  let salesTaxCollected = 0;

  for (const p of payments) {
    const m = new Date(p.paid_at).getUTCMonth();
    monthlyIncome[m] += p.amount;
    income += p.amount;
    const inv = p.invoices;
    if (inv && inv.total > 0) {
      salesTaxCollected += p.amount * (inv.tax_amount / inv.total);
    }
  }

  const byCategory = new Map<string, { total: number; line: string | null; deductible: boolean }>();
  let totalExpense = 0;
  for (const e of expenses) {
    const m = new Date(e.expense_date).getUTCMonth();
    monthlyExpense[m] += e.amount;
    totalExpense += e.amount;
    const name = e.expense_categories?.name ?? "Uncategorized";
    const cur = byCategory.get(name) ?? {
      total: 0,
      line: e.expense_categories?.schedule_c_line ?? null,
      deductible: e.expense_categories?.tax_deductible ?? true,
    };
    cur.total += e.amount;
    byCategory.set(name, cur);
  }

  const netProfit = income - totalExpense;
  const deductibleExpense = [...byCategory.values()]
    .filter((c) => c.deductible)
    .reduce((s, c) => s + c.total, 0);
  const estTaxableProfit = income - deductibleExpense;
  const outstandingAR = ((arData as { balance_due: number }[]) ?? []).reduce(
    (s, r) => s + (r.balance_due ?? 0),
    0,
  );

  const categoryRows = [...byCategory.entries()].sort((a, b) => b[1].total - a[1].total);
  const thisYear = new Date().getFullYear();
  const years = [thisYear, thisYear - 1, thisYear - 2];

  return (
    <div>
      <PageHeader
        title="Reports & Tax"
        subtitle={`Financial summary for ${year} (cash basis)`}
        actions={<PrintButton label="Print report" />}
      />

      <div className="mb-4 flex gap-2 print:hidden">
        {years.map((y) => (
          <Link
            key={y}
            href={`/accounting/reports?year=${y}`}
            className={`rounded-full px-3 py-1 text-sm ${
              y === year ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Income (collected)" value={formatCurrency(income)} tone="green" />
        <Stat label="Expenses" value={formatCurrency(totalExpense)} tone="red" />
        <Stat label="Net profit" value={formatCurrency(netProfit)} tone={netProfit >= 0 ? "green" : "red"} />
        <Stat
          label="Sales tax collected"
          value={formatCurrency(salesTaxCollected)}
          hint="Owed to the state"
          tone="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle>Monthly profit &amp; loss</SectionTitle>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="py-1.5">Month</th>
                <th className="py-1.5 text-right">Income</th>
                <th className="py-1.5 text-right">Expenses</th>
                <th className="py-1.5 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((mo, i) => {
                const net = monthlyIncome[i] - monthlyExpense[i];
                if (monthlyIncome[i] === 0 && monthlyExpense[i] === 0) return null;
                return (
                  <tr key={mo} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-600">{mo}</td>
                    <td className="py-1.5 text-right text-emerald-600">{formatCurrency(monthlyIncome[i])}</td>
                    <td className="py-1.5 text-right text-red-500">{formatCurrency(monthlyExpense[i])}</td>
                    <td className={`py-1.5 text-right font-medium ${net >= 0 ? "text-slate-800" : "text-red-600"}`}>
                      {formatCurrency(net)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-slate-200 font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right text-emerald-600">{formatCurrency(income)}</td>
                <td className="py-2 text-right text-red-500">{formatCurrency(totalExpense)}</td>
                <td className="py-2 text-right">{formatCurrency(netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Expenses by category (Schedule C)</SectionTitle>
          {categoryRows.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No expenses recorded for {year}.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-400">
                  <th className="py-1.5">Category</th>
                  <th className="py-1.5">Tax line</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map(([name, c]) => (
                  <tr key={name} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-700">{name}</td>
                    <td className="py-1.5 text-xs text-slate-400">{c.line ?? "—"}</td>
                    <td className="py-1.5 text-right font-medium">{formatCurrency(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <SectionTitle>Tax-time summary</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Summary label="Gross income (collected)" value={formatCurrency(income)} />
          <Summary label="Deductible expenses" value={formatCurrency(deductibleExpense)} />
          <Summary label="Est. taxable profit" value={formatCurrency(estTaxableProfit)} accent />
          <Summary label="Sales tax to remit" value={formatCurrency(salesTaxCollected)} />
        </div>
        <div className="mt-4">
          <Alert tone="amber" title="Heads up">
            You have <strong>{formatCurrency(outstandingAR)}</strong> in unpaid invoices (accounts
            receivable). On a cash basis that income isn&apos;t counted until it&apos;s collected.
            These figures are estimates to help you plan — confirm with your accountant before
            filing.
          </Alert>
        </div>
      </Card>
    </div>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? "border-brand-200 bg-brand-50" : "border-slate-200"}`}>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? "text-brand-700" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

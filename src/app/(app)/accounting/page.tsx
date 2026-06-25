import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Stat, Badge } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteExpense } from "@/lib/actions/expenses";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { Expense, ExpenseCategory } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = Expense & { expense_categories: ExpenseCategory | null };

export default async function AccountingPage({ searchParams }: { searchParams: { year?: string } }) {
  await requireAdmin();
  const supabase = createClient();

  const year = parseInt(searchParams.year ?? `${new Date().getFullYear()}`, 10);
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data } = await supabase
    .from("expenses")
    .select("*, expense_categories(*)")
    .gte("expense_date", start)
    .lte("expense_date", end)
    .order("expense_date", { ascending: false });
  const rows = (data as Row[]) ?? [];

  const total = rows.reduce((s, e) => s + e.amount, 0);
  const taxPaid = rows.reduce((s, e) => s + (e.tax_amount ?? 0), 0);
  const thisYear = new Date().getFullYear();
  const years = [thisYear, thisYear - 1, thisYear - 2];

  return (
    <div>
      <PageHeader
        title="Accounting"
        subtitle="Track every dollar going out of the shop"
        actions={
          <>
            <Link href="/accounting/reports" className="btn-secondary">
              Reports &amp; Tax
            </Link>
            <Link href="/accounting/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> Add expense
            </Link>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label={`${year} expenses`} value={formatCurrency(total)} tone="red" />
        <Stat label="Sales tax paid on purchases" value={formatCurrency(taxPaid)} />
        <Stat label="Entries" value={rows.length} />
      </div>

      <div className="mb-4 flex gap-2 print:hidden">
        {years.map((y) => (
          <Link
            key={y}
            href={`/accounting?year=${y}`}
            className={`rounded-full px-3 py-1 text-sm ${
              y === year ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={`No expenses recorded for ${year}`}
          description="Log shop expenses to keep your books accurate and tax time painless."
          action={
            <Link href="/accounting/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> Add expense
            </Link>
          }
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Category</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
              <th />
            </tr>
          }
        >
          {rows.map((e) => (
            <tr key={e.id}>
              <td>{formatDate(e.expense_date)}</td>
              <td className="font-medium text-slate-700">{e.vendor_name || "—"}</td>
              <td>
                {e.expense_categories ? (
                  <Badge tone="slate">{e.expense_categories.name}</Badge>
                ) : (
                  <span className="text-slate-400">Uncategorized</span>
                )}
              </td>
              <td className="text-slate-500">{PAYMENT_METHODS[e.payment_method]}</td>
              <td className="text-right font-medium">{formatCurrency(e.amount)}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <Link href={`/accounting/${e.id}/edit`} className="btn-ghost !px-2 !py-1 text-xs">
                    Edit
                  </Link>
                  <DeleteButton action={deleteExpense.bind(null, e.id)} iconOnly className="btn-ghost p-1.5" />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

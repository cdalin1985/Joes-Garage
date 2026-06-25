import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge, Stat } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { customerName, vehicleName } from "@/lib/display";
import { formatCurrency, formatDate } from "@/lib/format";
import { INVOICE_STATUS } from "@/lib/constants";
import type { Customer, Invoice, Vehicle } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = Invoice & { customers: Customer | null; vehicles: Vehicle | null };

export default async function InvoicesPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient();
  const status = searchParams.status;

  let query = supabase
    .from("invoices")
    .select("*, customers(*), vehicles(*)")
    .order("issue_date", { ascending: false })
    .limit(300);
  if (status) query = query.eq("status", status);

  const { data } = await query;
  const rows = (data as Row[]) ?? [];

  const outstanding = rows.reduce((s, i) => s + (i.balance_due ?? 0), 0);

  const filters = [
    { key: "", label: "All" },
    { key: "sent", label: "Sent" },
    { key: "partial", label: "Partial" },
    { key: "overdue", label: "Overdue" },
    { key: "paid", label: "Paid" },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Billing and payments"
        actions={
          <Link href="/invoices/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New invoice
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Invoices" value={rows.length} />
        <Stat
          label="Outstanding balance"
          value={formatCurrency(outstanding)}
          tone={outstanding > 0 ? "red" : "green"}
        />
        <Stat
          label="Collected (shown)"
          value={formatCurrency(rows.reduce((s, i) => s + (i.amount_paid ?? 0), 0))}
          tone="green"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/invoices?status=${f.key}` : "/invoices"}
            className={`rounded-full px-3 py-1 text-sm ${
              (status ?? "") === f.key ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No invoices"
          description="Create an invoice or convert an approved estimate."
          action={
            <Link href="/invoices/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> New invoice
            </Link>
          }
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Date</th>
              <th>Status</th>
              <th className="text-right">Total</th>
              <th className="text-right">Balance</th>
            </tr>
          }
        >
          {rows.map((i) => (
            <tr key={i.id}>
              <td>
                <Link href={`/invoices/${i.id}`} className="font-medium text-brand-700 hover:underline">
                  {i.number}
                </Link>
              </td>
              <td>{customerName(i.customers)}</td>
              <td className="text-slate-500">{i.vehicles ? vehicleName(i.vehicles) : "—"}</td>
              <td>{formatDate(i.issue_date)}</td>
              <td>
                <Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge>
              </td>
              <td className="text-right font-medium">{formatCurrency(i.total)}</td>
              <td className={`text-right font-medium ${(i.balance_due ?? 0) > 0 ? "text-red-600" : "text-slate-400"}`}>
                {formatCurrency(i.balance_due)}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

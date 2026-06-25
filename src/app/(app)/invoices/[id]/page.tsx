import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge, Card, SectionTitle } from "@/components/ui";
import { DocumentView } from "@/components/DocumentView";
import { PrintButton } from "@/components/PrintButton";
import { DeleteButton } from "@/components/DeleteButton";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { INVOICE_STATUS, PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  recordPayment,
  deletePayment,
  deleteInvoice,
  setInvoiceStatus,
} from "@/lib/actions/invoices";
import { getShopSettings } from "@/lib/queries";
import type {
  Customer,
  Invoice,
  InvoiceItem,
  Payment,
  Vehicle,
} from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const id = params.id;

  const [{ data: invoice }, { data: payments }, settings] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, customers(*), vehicles(*), invoice_items(*)")
      .eq("id", id)
      .single(),
    supabase.from("payments").select("*").eq("invoice_id", id).order("paid_at", { ascending: false }),
    getShopSettings(),
  ]);

  if (!invoice) notFound();
  const inv = invoice as Invoice & {
    customers: Customer | null;
    vehicles: Vehicle | null;
    invoice_items: InvoiceItem[];
  };
  const items = (inv.invoice_items ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const pays = (payments as Payment[]) ?? [];

  return (
    <div>
      <PageHeader
        title={`Invoice ${inv.number}`}
        backHref="/invoices"
        actions={
          <>
            <Badge tone={INVOICE_STATUS[inv.status].tone}>{INVOICE_STATUS[inv.status].label}</Badge>
            <PrintButton />
            <Link href={`/invoices/${id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <DeleteButton action={deleteInvoice.bind(null, id)} iconOnly />
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2 print:hidden">
        {inv.status === "draft" && (
          <form action={setInvoiceStatus.bind(null, id, "sent")}>
            <button className="btn-secondary">Mark as sent</button>
          </form>
        )}
        {inv.status !== "void" && inv.status !== "paid" && (
          <form action={setInvoiceStatus.bind(null, id, "void")}>
            <button className="btn-secondary">Void</button>
          </form>
        )}
        <Link href={`/work-orders/new?invoice=${id}`} className="btn-secondary">
          Create work order
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DocumentView
            title="Invoice"
            shop={settings}
            customer={inv.customers}
            vehicle={inv.vehicles}
            items={items}
            doc={{
              number: inv.number,
              issue_date: inv.issue_date,
              secondDateLabel: "Due",
              secondDate: inv.due_date,
              subtotal: inv.subtotal,
              tax_rate: inv.tax_rate,
              tax_amount: inv.tax_amount,
              total: inv.total,
              notes: inv.notes,
              terms: inv.terms,
              amount_paid: inv.amount_paid,
              balance_due: inv.balance_due,
            }}
          />
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle>Record a payment</SectionTitle>
            {inv.balance_due <= 0 ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Paid in full — thank you!
              </p>
            ) : (
              <PaymentForm action={recordPayment.bind(null, id)} balanceDue={inv.balance_due} />
            )}
          </Card>

          <Card>
            <SectionTitle>Payment history</SectionTitle>
            {pays.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">No payments recorded.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pays.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-slate-400">
                        {PAYMENT_METHODS[p.method]} · {formatDate(p.paid_at)}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </p>
                    </div>
                    <DeleteButton
                      action={deletePayment.bind(null, p.id, id)}
                      iconOnly
                      className="btn-ghost p-1.5"
                      confirmText="Remove this payment?"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

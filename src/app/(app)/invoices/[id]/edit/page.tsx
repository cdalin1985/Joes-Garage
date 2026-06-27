import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { DocumentEditor } from "@/components/forms/DocumentEditor";
import { updateInvoice } from "@/lib/actions/invoices";
import { getEditorData } from "@/lib/queries";
import type { Invoice, InvoiceItem } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", params.id)
    .single();
  if (!data) notFound();
  const inv = data as Invoice & { invoice_items: InvoiceItem[] };

  const { customers, vehicles, parts, laborPresets, settings } = await getEditorData();
  const action = updateInvoice.bind(null, params.id);

  return (
    <div>
      <PageHeader title={`Edit ${inv.number}`} backHref={`/invoices/${params.id}`} />
      <DocumentEditor
        kind="invoice"
        action={action}
        customers={customers}
        vehicles={vehicles}
        parts={parts}
        laborPresets={laborPresets}
        laborRate={settings?.default_labor_rate ?? 120}
        cancelHref={`/invoices/${params.id}`}
        defaults={{
          customer_id: inv.customer_id,
          vehicle_id: inv.vehicle_id,
          issue_date: inv.issue_date,
          second_date: inv.due_date,
          tax_rate_pct: inv.tax_rate * 100,
          status: inv.status,
          notes: inv.notes,
          terms: inv.terms,
          items: (inv.invoice_items ?? [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((it) => ({
              item_type: it.item_type,
              description: it.description,
              quantity: it.quantity,
              unit_price: it.unit_price,
              taxable: it.taxable,
              part_id: it.part_id,
            })),
        }}
      />
    </div>
  );
}

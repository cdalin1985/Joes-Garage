import { PageHeader } from "@/components/ui";
import { DocumentEditor } from "@/components/forms/DocumentEditor";
import { createInvoice } from "@/lib/actions/invoices";
import { getEditorData } from "@/lib/queries";
import { todayISO, addDaysISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: { customer?: string; vehicle?: string };
}) {
  const { customers, vehicles, parts, laborPresets, settings } = await getEditorData();
  const taxPct = (settings?.default_tax_rate ?? 0) * 100;

  return (
    <div>
      <PageHeader title="New invoice" backHref="/invoices" />
      <DocumentEditor
        kind="invoice"
        action={createInvoice}
        customers={customers}
        vehicles={vehicles}
        parts={parts}
        laborPresets={laborPresets}
        laborRate={settings?.default_labor_rate ?? 120}
        cancelHref="/invoices"
        defaults={{
          customer_id: searchParams.customer ?? null,
          vehicle_id: searchParams.vehicle ?? null,
          issue_date: todayISO(),
          second_date: addDaysISO(15),
          tax_rate_pct: taxPct,
          status: "draft",
          terms: settings?.invoice_terms ?? null,
          items: [],
        }}
      />
    </div>
  );
}

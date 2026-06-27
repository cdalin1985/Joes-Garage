import { PageHeader } from "@/components/ui";
import { DocumentEditor } from "@/components/forms/DocumentEditor";
import { createEstimate } from "@/lib/actions/estimates";
import { getEditorData } from "@/lib/queries";
import { todayISO, addDaysISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewEstimatePage({
  searchParams,
}: {
  searchParams: { customer?: string; vehicle?: string };
}) {
  const { customers, vehicles, parts, laborPresets, settings } = await getEditorData();
  const taxPct = (settings?.default_tax_rate ?? 0) * 100;

  return (
    <div>
      <PageHeader title="New estimate" backHref="/estimates" />
      <DocumentEditor
        kind="estimate"
        action={createEstimate}
        customers={customers}
        vehicles={vehicles}
        parts={parts}
        laborPresets={laborPresets}
        laborRate={settings?.default_labor_rate ?? 120}
        cancelHref="/estimates"
        defaults={{
          customer_id: searchParams.customer ?? null,
          vehicle_id: searchParams.vehicle ?? null,
          issue_date: todayISO(),
          second_date: addDaysISO(30),
          tax_rate_pct: taxPct,
          status: "draft",
          terms: settings?.estimate_terms ?? null,
          items: [],
        }}
      />
    </div>
  );
}

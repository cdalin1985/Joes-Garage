import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { DocumentEditor } from "@/components/forms/DocumentEditor";
import { updateEstimate } from "@/lib/actions/estimates";
import { getEditorData } from "@/lib/queries";
import type { Estimate, EstimateItem } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditEstimatePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("estimates")
    .select("*, estimate_items(*)")
    .eq("id", params.id)
    .single();
  if (!data) notFound();
  const e = data as Estimate & { estimate_items: EstimateItem[] };

  const { customers, vehicles, parts, laborPresets, settings } = await getEditorData();
  const action = updateEstimate.bind(null, params.id);

  return (
    <div>
      <PageHeader title={`Edit ${e.number}`} backHref={`/estimates/${params.id}`} />
      <DocumentEditor
        kind="estimate"
        action={action}
        customers={customers}
        vehicles={vehicles}
        parts={parts}
        laborPresets={laborPresets}
        laborRate={settings?.default_labor_rate ?? 120}
        cancelHref={`/estimates/${params.id}`}
        defaults={{
          customer_id: e.customer_id,
          vehicle_id: e.vehicle_id,
          issue_date: e.issue_date,
          second_date: e.expiry_date,
          tax_rate_pct: e.tax_rate * 100,
          status: e.status,
          customer_concern: e.customer_concern,
          notes: e.notes,
          terms: e.terms,
          items: (e.estimate_items ?? [])
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

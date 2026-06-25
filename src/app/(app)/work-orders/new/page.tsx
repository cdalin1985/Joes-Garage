import { PageHeader } from "@/components/ui";
import { WorkOrderEditor } from "@/components/forms/WorkOrderEditor";
import { createWorkOrder } from "@/lib/actions/work-orders";
import { getEditorData } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { EditorItem } from "@/components/forms/DocumentEditor";
import type { Invoice, InvoiceItem, Profile } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: { customer?: string; vehicle?: string; invoice?: string };
}) {
  const supabase = createClient();
  const { customers, vehicles, parts, settings } = await getEditorData();

  const { data: techData } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name");
  const technicians = (techData as Profile[]) ?? [];

  let customerId = searchParams.customer ?? null;
  let vehicleId = searchParams.vehicle ?? null;
  let items: EditorItem[] = [];

  // Prefill from an invoice if provided.
  if (searchParams.invoice) {
    const { data } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", searchParams.invoice)
      .single();
    if (data) {
      const inv = data as Invoice & { invoice_items: InvoiceItem[] };
      customerId = inv.customer_id;
      vehicleId = inv.vehicle_id;
      items = (inv.invoice_items ?? []).map((it) => ({
        item_type: it.item_type,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        taxable: it.taxable,
        part_id: it.part_id,
      }));
    }
  }

  return (
    <div>
      <PageHeader title="New work order" backHref="/work-orders" />
      <WorkOrderEditor
        action={createWorkOrder}
        customers={customers}
        vehicles={vehicles}
        parts={parts}
        technicians={technicians}
        laborRate={settings?.default_labor_rate ?? 120}
        cancelHref="/work-orders"
        defaults={{
          customer_id: customerId,
          vehicle_id: vehicleId,
          status: "intake",
          priority: "normal",
          items,
        }}
      />
    </div>
  );
}

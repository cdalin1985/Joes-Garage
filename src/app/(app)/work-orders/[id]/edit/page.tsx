import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { WorkOrderEditor } from "@/components/forms/WorkOrderEditor";
import { updateWorkOrder } from "@/lib/actions/work-orders";
import { getEditorData } from "@/lib/queries";
import type { Profile, WorkOrder, WorkOrderItem } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditWorkOrderPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("work_orders")
    .select("*, work_order_items(*)")
    .eq("id", params.id)
    .single();
  if (!data) notFound();
  const w = data as WorkOrder & { work_order_items: WorkOrderItem[] };

  const { customers, vehicles, parts, settings } = await getEditorData();
  const { data: techData } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name");
  const technicians = (techData as Profile[]) ?? [];

  const action = updateWorkOrder.bind(null, params.id);

  return (
    <div>
      <PageHeader title={`Edit ${w.number}`} backHref={`/work-orders/${params.id}`} />
      <WorkOrderEditor
        action={action}
        customers={customers}
        vehicles={vehicles}
        parts={parts}
        technicians={technicians}
        laborRate={settings?.default_labor_rate ?? 120}
        cancelHref={`/work-orders/${params.id}`}
        defaults={{
          customer_id: w.customer_id,
          vehicle_id: w.vehicle_id,
          status: w.status,
          priority: w.priority,
          assigned_to: w.assigned_to,
          odometer_in: w.odometer_in,
          odometer_out: w.odometer_out,
          customer_concern: w.customer_concern,
          diagnosis: w.diagnosis,
          work_performed: w.work_performed,
          recommendations: w.recommendations,
          notes: w.notes,
          items: (w.work_order_items ?? [])
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

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { VehicleForm } from "@/components/forms/VehicleForm";
import { createVehicle } from "@/lib/actions/vehicles";
import { customerName } from "@/lib/display";
import type { Customer } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function NewVehiclePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("customers").select("*").eq("id", params.id).single();
  if (!data) notFound();

  const action = createVehicle.bind(null, params.id);

  return (
    <div>
      <PageHeader
        title="Add vehicle"
        subtitle={`for ${customerName(data as Customer)}`}
        backHref={`/customers/${params.id}`}
      />
      <VehicleForm action={action} cancelHref={`/customers/${params.id}`} />
    </div>
  );
}

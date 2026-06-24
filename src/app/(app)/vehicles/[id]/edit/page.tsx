import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { VehicleForm } from "@/components/forms/VehicleForm";
import { updateVehicle } from "@/lib/actions/vehicles";
import type { Vehicle } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditVehiclePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("vehicles").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const v = data as Vehicle;

  const action = updateVehicle.bind(null, v.id, v.customer_id);

  return (
    <div>
      <PageHeader title="Edit vehicle" backHref={`/vehicles/${v.id}`} />
      <VehicleForm action={action} vehicle={v} cancelHref={`/vehicles/${v.id}`} />
    </div>
  );
}

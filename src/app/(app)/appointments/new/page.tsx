import { PageHeader } from "@/components/ui";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { createAppointment } from "@/lib/actions/appointments";
import { createClient } from "@/lib/supabase/server";
import type { Customer, Profile, Vehicle } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function NewAppointmentPage() {
  const supabase = createClient();
  const [{ data: customers }, { data: vehicles }, { data: techs }] = await Promise.all([
    supabase.from("customers").select("*").order("last_name"),
    supabase.from("vehicles").select("*"),
    supabase.from("profiles").select("*").eq("is_active", true).order("full_name"),
  ]);

  return (
    <div>
      <PageHeader title="New appointment" backHref="/appointments" />
      <AppointmentForm
        action={createAppointment}
        customers={(customers as Customer[]) ?? []}
        vehicles={(vehicles as Vehicle[]) ?? []}
        technicians={(techs as Profile[]) ?? []}
        cancelHref="/appointments"
      />
    </div>
  );
}

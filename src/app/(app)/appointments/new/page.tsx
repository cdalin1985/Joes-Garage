import { PageHeader } from "@/components/ui";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { createAppointment } from "@/lib/actions/appointments";
import { createClient } from "@/lib/supabase/server";
import type { Customer, Profile, Vehicle } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function NewAppointmentPage({ searchParams }: { searchParams: { date?: string; start?: string } }) {
  const supabase = createClient();
  const [{ data: customers }, { data: vehicles }, { data: techs }] = await Promise.all([
    supabase.from("customers").select("*").order("last_name"),
    supabase.from("vehicles").select("*"),
    supabase.from("profiles").select("*").eq("is_active", true).order("full_name"),
  ]);

  // Prefill start from a clicked calendar slot: ?start=YYYY-MM-DDTHH:mm or ?date=YYYY-MM-DD (defaults to 9 AM).
  let defaultStart = "";
  if (searchParams.start && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(searchParams.start)) defaultStart = searchParams.start.slice(0, 16);
  else if (searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)) defaultStart = `${searchParams.date}T09:00`;

  return (
    <div>
      <PageHeader title="New appointment" backHref="/appointments" />
      <AppointmentForm
        action={createAppointment}
        customers={(customers as Customer[]) ?? []}
        vehicles={(vehicles as Vehicle[]) ?? []}
        technicians={(techs as Profile[]) ?? []}
        defaultStart={defaultStart}
        cancelHref="/appointments"
      />
    </div>
  );
}

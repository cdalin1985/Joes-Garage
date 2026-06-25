import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, EmptyState, SectionTitle } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteAppointment } from "@/lib/actions/appointments";
import { customerName, vehicleName } from "@/lib/display";
import { formatDateTime } from "@/lib/format";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import type { Appointment, Customer, Vehicle } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = Appointment & { customers: Customer | null; vehicles: Vehicle | null };

export default async function AppointmentsPage() {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("appointments")
    .select("*, customers(*), vehicles(*)")
    .gte("start_time", new Date(Date.now() - 86400000).toISOString())
    .order("start_time", { ascending: true })
    .limit(100);
  const rows = (data as Row[]) ?? [];

  // group by day
  const groups = new Map<string, Row[]>();
  for (const a of rows) {
    const day = new Date(a.start_time).toDateString();
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(a);
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Upcoming bookings"
        actions={
          <Link href="/appointments/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New appointment
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No upcoming appointments"
          description="Schedule a customer's next visit to keep the bays full."
          action={
            <Link href="/appointments/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> New appointment
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {[...groups.entries()].map(([day, items]) => (
            <Card key={day}>
              <SectionTitle>{day}</SectionTitle>
              <ul className="divide-y divide-slate-100">
                {items.map((a) => {
                  const past = new Date(a.start_time).toISOString() < nowIso;
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{a.title}</p>
                        <p className="text-xs text-slate-400">
                          {formatDateTime(a.start_time)}
                          {a.customers ? ` · ${customerName(a.customers)}` : ""}
                          {a.vehicles ? ` · ${vehicleName(a.vehicles)}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={past ? "slate" : APPOINTMENT_STATUS[a.status].tone}>
                          {APPOINTMENT_STATUS[a.status].label}
                        </Badge>
                        <DeleteButton
                          action={deleteAppointment.bind(null, a.id)}
                          iconOnly
                          className="btn-ghost p-1.5"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

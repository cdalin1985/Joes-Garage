import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addMileageLog, deleteMileageLog } from "@/lib/actions/tax";
import { PageHeader, Card, Stat, SectionTitle, Alert, Field, DataTable, EmptyState } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { STANDARD_MILEAGE_RATE, TAX_YEAR } from "@/lib/tax";
import type { MileageLog } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function MileagePage({ searchParams }: { searchParams: { year?: string } }) {
  await requireAdmin();
  const year = parseInt(searchParams.year ?? `${TAX_YEAR}`, 10);
  const supabase = createClient();
  const { data } = await supabase
    .from("mileage_logs")
    .select("*")
    .gte("trip_date", `${year}-01-01`)
    .lte("trip_date", `${year}-12-31`)
    .order("trip_date", { ascending: false });
  const logs = (data as MileageLog[]) ?? [];

  const totalMiles = logs.reduce((s, l) => s + (l.miles ?? 0), 0);
  const deduction = totalMiles * STANDARD_MILEAGE_RATE;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Mileage Log" subtitle={`${year} business miles · ${STANDARD_MILEAGE_RATE * 100}¢ per mile`} backHref="/accounting/tax" />

      <Alert tone="blue" title="Every business mile counts">
        Parts runs, dealer pickups, bank trips, customer drop-offs. The IRS wants a contemporaneous
        log — date, miles, and purpose — which is exactly what this is. At 2025&apos;s 70¢/mile,
        even 5,000 miles is a <strong>{formatCurrency(5000 * STANDARD_MILEAGE_RATE)}</strong> deduction.
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label={`${year} business miles`} value={totalMiles.toLocaleString()} tone="blue" />
        <Stat label="Deduction" value={formatCurrency(deduction)} tone="green" hint="Flows to Schedule C line 9" />
        <Stat label="Trips logged" value={logs.length} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card>
          <SectionTitle>Log a trip</SectionTitle>
          <form action={addMileageLog} className="space-y-3">
            <Field label="Date">
              <input type="date" name="trip_date" defaultValue={today} className="input" required />
            </Field>
            <Field label="Purpose" hint="e.g. Parts pickup at NAPA">
              <input name="purpose" className="input" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <input name="from_location" className="input" />
              </Field>
              <Field label="To">
                <input name="to_location" className="input" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Odo start">
                <input type="number" step="0.1" name="odometer_start" className="input" />
              </Field>
              <Field label="Odo end">
                <input type="number" step="0.1" name="odometer_end" className="input" />
              </Field>
              <Field label="Miles" hint="or auto">
                <input type="number" step="0.1" name="miles" className="input" />
              </Field>
            </div>
            <button className="btn-primary w-full">Add trip</button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          {logs.length === 0 ? (
            <EmptyState title={`No trips logged for ${year}`} description="Add trips as you take them — a consistent log is your best defense in an audit." />
          ) : (
            <DataTable head={<tr><th>Date</th><th>Purpose</th><th>Route</th><th className="text-right">Miles</th><th className="text-right">Value</th><th /></tr>}>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{formatDate(l.trip_date)}</td>
                  <td className="font-medium text-slate-700">{l.purpose || "—"}</td>
                  <td className="text-slate-500">{l.from_location && l.to_location ? `${l.from_location} → ${l.to_location}` : "—"}</td>
                  <td className="text-right tabular-nums">{l.miles?.toLocaleString()}</td>
                  <td className="text-right tabular-nums text-emerald-600">{formatCurrency((l.miles ?? 0) * STANDARD_MILEAGE_RATE)}</td>
                  <td className="text-right"><DeleteButton action={deleteMileageLog.bind(null, l.id)} iconOnly className="btn-ghost p-1.5" /></td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </div>
    </div>
  );
}

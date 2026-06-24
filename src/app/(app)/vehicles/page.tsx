import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState } from "@/components/ui";
import { IconSearch } from "@/components/icons";
import { customerName, vehicleName } from "@/lib/display";
import type { Customer, Vehicle } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type VehicleRow = Vehicle & { customers: Customer | null };

export default async function VehiclesPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const q = searchParams.q?.trim();

  let query = supabase
    .from("vehicles")
    .select("*, customers(*)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(
      `make.ilike.%${q}%,model.ilike.%${q}%,vin.ilike.%${q}%,license_plate.ilike.%${q}%`,
    );
  }

  const { data } = await query;
  const vehicles = (data as VehicleRow[]) ?? [];

  return (
    <div>
      <PageHeader title="Vehicles" subtitle="Every vehicle the shop services" />

      <form className="mb-4 flex max-w-md items-center gap-2" action="/vehicles">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q ?? ""} placeholder="Search make, model, VIN, plate…" className="input pl-9" />
        </div>
        <button className="btn-secondary">Search</button>
      </form>

      {vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles"
          description="Vehicles are added from a customer's profile."
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th>Vehicle</th>
              <th>Owner</th>
              <th>Plate</th>
              <th>VIN</th>
              <th>Mileage</th>
            </tr>
          }
        >
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td>
                <Link href={`/vehicles/${v.id}`} className="font-medium text-brand-700 hover:underline">
                  {vehicleName(v)}
                </Link>
              </td>
              <td>
                {v.customers ? (
                  <Link href={`/customers/${v.customer_id}`} className="text-slate-600 hover:underline">
                    {customerName(v.customers)}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="uppercase">{v.license_plate || "—"}</td>
              <td className="font-mono text-xs">{v.vin || "—"}</td>
              <td>{v.mileage ? `${v.mileage.toLocaleString()} mi` : "—"}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

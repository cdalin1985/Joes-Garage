import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { customerName, vehicleName } from "@/lib/display";
import { formatCurrency, formatDate } from "@/lib/format";
import { ESTIMATE_STATUS } from "@/lib/constants";
import type { Customer, Estimate, Vehicle } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Row = Estimate & { customers: Customer | null; vehicles: Vehicle | null };

export default async function EstimatesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("estimates")
    .select("*, customers(*), vehicles(*)")
    .order("issue_date", { ascending: false })
    .limit(200);
  const rows = (data as Row[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Estimates"
        subtitle="Quotes awaiting customer approval"
        actions={
          <Link href="/estimates/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New estimate
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No estimates yet"
          description="Create an estimate to quote a customer before doing the work."
          action={
            <Link href="/estimates/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> New estimate
            </Link>
          }
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th>Estimate #</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Date</th>
              <th>Status</th>
              <th className="text-right">Total</th>
            </tr>
          }
        >
          {rows.map((e) => (
            <tr key={e.id}>
              <td>
                <Link href={`/estimates/${e.id}`} className="font-medium text-brand-700 hover:underline">
                  {e.number}
                </Link>
              </td>
              <td>{customerName(e.customers)}</td>
              <td className="text-slate-500">{e.vehicles ? vehicleName(e.vehicles) : "—"}</td>
              <td>{formatDate(e.issue_date)}</td>
              <td>
                <Badge tone={ESTIMATE_STATUS[e.status].tone}>{ESTIMATE_STATUS[e.status].label}</Badge>
              </td>
              <td className="text-right font-medium">{formatCurrency(e.total)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

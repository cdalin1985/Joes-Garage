import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, DataTable, Stat } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { formatCurrency } from "@/lib/format";
import type { Profile } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type LaborRow = {
  quantity: number;
  unit_price: number;
  work_orders: { assigned_to: string | null; status: string } | null;
};

export default async function TechPerformancePage() {
  await requireAdmin();
  const supabase = createClient();

  const [{ data: profileData }, { data: laborData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("is_active", true).order("full_name"),
    supabase
      .from("work_order_items")
      .select("quantity, unit_price, work_orders(assigned_to, status)")
      .eq("item_type", "labor"),
  ]);

  const profiles = (profileData as Profile[]) ?? [];
  const laborRows = (laborData as unknown as LaborRow[]) ?? [];

  const stats = new Map<
    string,
    { hours: number; revenue: number; jobs: Set<string>; completedJobs: number }
  >();

  for (const row of laborRows) {
    const wo = row.work_orders;
    const techId = wo?.assigned_to;
    if (!techId) continue;
    const cur = stats.get(techId) ?? { hours: 0, revenue: 0, jobs: new Set<string>(), completedJobs: 0 };
    cur.hours += row.quantity;
    cur.revenue += row.quantity * row.unit_price;
    stats.set(techId, cur);
  }

  // count distinct completed/delivered work orders per tech, separate query for accuracy
  const { data: woData } = await supabase
    .from("work_orders")
    .select("id, assigned_to, status")
    .in("status", ["completed", "delivered"]);
  for (const wo of (woData as { id: string; assigned_to: string | null; status: string }[]) ?? []) {
    if (!wo.assigned_to) continue;
    const cur = stats.get(wo.assigned_to) ?? { hours: 0, revenue: 0, jobs: new Set<string>(), completedJobs: 0 };
    cur.completedJobs += 1;
    stats.set(wo.assigned_to, cur);
  }

  const rows = profiles
    .map((p) => {
      const s = stats.get(p.id) ?? { hours: 0, revenue: 0, jobs: new Set<string>(), completedJobs: 0 };
      const laborCost = p.hourly_rate ? s.hours * p.hourly_rate : null;
      return {
        profile: p,
        hours: s.hours,
        revenue: s.revenue,
        completedJobs: s.completedJobs,
        laborCost,
        grossMargin: laborCost != null ? s.revenue - laborCost : null,
      };
    })
    .filter((r) => r.hours > 0 || r.completedJobs > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const totalJobs = rows.reduce((s, r) => s + r.completedJobs, 0);

  return (
    <div>
      <PageHeader
        title="Technician Performance"
        subtitle="Billed labor hours, revenue, and completed jobs by technician"
        backHref="/staff"
        actions={<PrintButton label="Print report" />}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Billed labor revenue" value={formatCurrency(totalRevenue)} tone="green" />
        <Stat label="Billed labor hours" value={totalHours.toFixed(1)} />
        <Stat label="Completed jobs" value={totalJobs} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <p className="py-4 text-center text-sm text-slate-400">
            No billed labor on completed work orders yet.
          </p>
        </Card>
      ) : (
        <DataTable
          head={
            <tr>
              <th>Technician</th>
              <th className="text-right">Completed jobs</th>
              <th className="text-right">Labor hours</th>
              <th className="text-right">Labor revenue</th>
              <th className="text-right">Labor cost</th>
              <th className="text-right">Gross margin</th>
            </tr>
          }
        >
          {rows.map((r) => (
            <tr key={r.profile.id}>
              <td className="font-medium text-slate-800">{r.profile.full_name || r.profile.email}</td>
              <td className="text-right text-slate-500">{r.completedJobs}</td>
              <td className="text-right text-slate-500">{r.hours.toFixed(1)}</td>
              <td className="text-right font-medium">{formatCurrency(r.revenue)}</td>
              <td className="text-right text-slate-500">{r.laborCost != null ? formatCurrency(r.laborCost) : "—"}</td>
              <td className="text-right font-medium text-emerald-600">
                {r.grossMargin != null ? formatCurrency(r.grossMargin) : "—"}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

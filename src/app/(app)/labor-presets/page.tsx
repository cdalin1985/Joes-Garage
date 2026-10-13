import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge, Stat } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteLaborPreset } from "@/lib/actions/labor-presets";
import { formatCurrency } from "@/lib/format";
import type { LaborPreset } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function LaborPresetsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("labor_presets")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("name");
  const presets = (data as LaborPreset[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Labor Rate Book"
        subtitle="Canned jobs you can drop straight onto an estimate or invoice"
        actions={
          <Link href="/labor-presets/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New job
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Canned jobs" value={presets.length} />
      </div>

      {presets.length === 0 ? (
        <EmptyState
          title="No canned jobs yet"
          description="Save your common jobs with default hours and rates so you can add them to a job in one click."
          action={
            <Link href="/labor-presets/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> New job
            </Link>
          }
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th>Job</th>
              <th>Category</th>
              <th className="text-right">Default hours</th>
              <th className="text-right">Default rate</th>
              <th className="w-8" />
            </tr>
          }
        >
          {presets.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/labor-presets/${p.id}/edit`} className="font-medium text-brand-700 hover:underline">
                  {p.name}
                </Link>
              </td>
              <td>{p.category ? <Badge tone="slate">{p.category}</Badge> : "—"}</td>
              <td className="text-right text-slate-500">{p.default_hours}</td>
              <td className="text-right text-slate-500">
                {p.default_rate != null ? formatCurrency(p.default_rate) : "Shop default"}
              </td>
              <td className="text-right">
                <DeleteButton
                  action={deleteLaborPreset.bind(null, p.id)}
                  label="Archive"
                  confirmText="Archive this canned job?"
                  iconOnly
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

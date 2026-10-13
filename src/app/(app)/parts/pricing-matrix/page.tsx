import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Alert, Field, DataTable } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { createTier, updateTier, deleteTier, repriceAllParts } from "@/lib/actions/pricing-matrix";
import type { PricingMatrixTier } from "@/lib/database.types";

export const dynamic = "force-dynamic";

function fmtRange(t: PricingMatrixTier) {
  const lo = `$${t.cost_min.toFixed(2)}`;
  const hi = t.cost_max == null ? "and up" : `–$${t.cost_max.toFixed(2)}`;
  return t.cost_max == null ? `${lo} ${hi}` : `${lo}${hi}`;
}

export default async function PricingMatrixPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase.from("pricing_matrix_tiers").select("*").order("sort_order").order("cost_min");
  const tiers = (data as PricingMatrixTier[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Parts Pricing Matrix"
        subtitle="Set retail markup by cost bracket — new parts price themselves"
        backHref="/parts"
        actions={
          <form action={repriceAllParts}>
            <button className="btn-secondary">Reprice all parts</button>
          </form>
        }
      />

      <div className="mb-5">
        <Alert tone="blue" title="How it works">
          When you enter a part&apos;s <strong>cost</strong>, its <strong>price</strong> is set automatically
          from the bracket its cost falls into: <code>price = cost × markup</code>. Cheaper parts carry a
          higher markup, big-ticket parts a lower one — the standard shop approach. You can always override a
          single part&apos;s price. <strong>Reprice all parts</strong> re-applies the matrix to your whole
          active catalog at once.
        </Alert>
      </div>

      <Card className="mb-5">
        {tiers.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No tiers yet — add your first bracket below.</p>
        ) : (
          <DataTable
            head={
              <tr>
                <th>Bracket</th>
                <th>Label</th>
                <th className="text-right">Markup ×</th>
                <th className="text-right">Margin</th>
                <th>Example</th>
                <th></th>
              </tr>
            }
          >
            {tiers.map((t) => {
              const example = t.cost_min > 0 ? t.cost_min : (t.cost_max ?? 10) / 2 || 10;
              const exPrice = Math.round(example * t.markup_multiplier * 100) / 100;
              const margin = exPrice > 0 ? ((exPrice - example) / exPrice) * 100 : 0;
              return (
                <tr key={t.id}>
                  <td colSpan={6} className="!p-0">
                    <form action={updateTier.bind(null, t.id)} className="grid grid-cols-2 items-end gap-3 px-4 py-3 sm:grid-cols-6">
                      <Field label="Cost min">
                        <input name="cost_min" type="number" step="0.01" defaultValue={t.cost_min} className="input !py-1.5" />
                      </Field>
                      <Field label="Cost max (blank = ∞)">
                        <input name="cost_max" type="number" step="0.01" defaultValue={t.cost_max ?? ""} className="input !py-1.5" />
                      </Field>
                      <Field label="Markup ×">
                        <input name="markup_multiplier" type="number" step="0.01" defaultValue={t.markup_multiplier} className="input !py-1.5" />
                      </Field>
                      <Field label="Label">
                        <input name="label" defaultValue={t.label ?? ""} className="input !py-1.5" />
                      </Field>
                      <Field label="Order">
                        <input name="sort_order" type="number" step="1" defaultValue={t.sort_order} className="input !py-1.5" />
                      </Field>
                      <div className="flex items-center gap-2">
                        <button className="btn-secondary !py-1.5 text-xs">Save</button>
                        <DeleteButton action={deleteTier.bind(null, t.id)} iconOnly confirmText="Delete this pricing tier?" className="btn-ghost p-1.5" />
                      </div>
                      <p className="col-span-2 text-xs text-slate-400 sm:col-span-6">
                        {fmtRange(t)} → e.g. a ${example.toFixed(2)} part sells for{" "}
                        <span className="font-medium text-slate-600">${exPrice.toFixed(2)}</span> ({margin.toFixed(0)}% margin)
                      </p>
                    </form>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold text-slate-700">Add a bracket</p>
        <form action={createTier} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-6">
          <Field label="Cost min">
            <input name="cost_min" type="number" step="0.01" defaultValue="0" className="input !py-1.5" />
          </Field>
          <Field label="Cost max (blank = ∞)">
            <input name="cost_max" type="number" step="0.01" className="input !py-1.5" />
          </Field>
          <Field label="Markup ×">
            <input name="markup_multiplier" type="number" step="0.01" defaultValue="2.0" className="input !py-1.5" />
          </Field>
          <Field label="Label">
            <input name="label" className="input !py-1.5" placeholder="Common parts" />
          </Field>
          <Field label="Order">
            <input name="sort_order" type="number" step="1" defaultValue={tiers.length + 1} className="input !py-1.5" />
          </Field>
          <button className="btn-primary !py-1.5 text-xs">Add tier</button>
        </form>
      </Card>
    </div>
  );
}

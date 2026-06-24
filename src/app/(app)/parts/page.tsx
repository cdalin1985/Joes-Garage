import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge, Stat } from "@/components/ui";
import { IconPlus, IconAlert } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import type { Part } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function PartsPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const q = searchParams.q?.trim();

  let query = supabase
    .from("parts")
    .select("*")
    .eq("is_active", true)
    .order("name")
    .limit(300);
  if (q) query = query.or(`name.ilike.%${q}%,part_number.ilike.%${q}%,category.ilike.%${q}%`);

  const { data } = await query;
  const parts = (data as Part[]) ?? [];
  const lowStock = parts.filter((p) => p.reorder_level > 0 && p.quantity_on_hand <= p.reorder_level);
  const inventoryValue = parts.reduce((s, p) => s + p.cost * p.quantity_on_hand, 0);

  return (
    <div>
      <PageHeader
        title="Parts & Inventory"
        subtitle="Your catalog of parts and shop materials"
        actions={
          <Link href="/parts/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New part
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Active parts" value={parts.length} />
        <Stat label="Inventory value (at cost)" value={formatCurrency(inventoryValue)} />
        <Stat label="Low stock" value={lowStock.length} tone={lowStock.length ? "amber" : "slate"} />
      </div>

      <form className="mb-4 flex max-w-md items-center gap-2" action="/parts">
        <input name="q" defaultValue={q ?? ""} placeholder="Search parts…" className="input" />
        <button className="btn-secondary">Search</button>
      </form>

      {parts.length === 0 ? (
        <EmptyState
          title="No parts yet"
          description="Add parts so you can quickly drop them onto estimates, invoices, and work orders."
          action={
            <Link href="/parts/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> New part
            </Link>
          }
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th>Part</th>
              <th>Number</th>
              <th>Category</th>
              <th className="text-right">Cost</th>
              <th className="text-right">Price</th>
              <th className="text-right">On hand</th>
            </tr>
          }
        >
          {parts.map((p) => {
            const low = p.reorder_level > 0 && p.quantity_on_hand <= p.reorder_level;
            return (
              <tr key={p.id}>
                <td>
                  <Link href={`/parts/${p.id}/edit`} className="font-medium text-brand-700 hover:underline">
                    {p.name}
                  </Link>
                  {p.brand && <span className="ml-1 text-xs text-slate-400">{p.brand}</span>}
                </td>
                <td className="font-mono text-xs text-slate-500">{p.part_number || "—"}</td>
                <td>{p.category ? <Badge tone="slate">{p.category}</Badge> : "—"}</td>
                <td className="text-right text-slate-500">{formatCurrency(p.cost)}</td>
                <td className="text-right font-medium">{formatCurrency(p.price)}</td>
                <td className="text-right">
                  <span className={low ? "inline-flex items-center gap-1 font-medium text-amber-600" : ""}>
                    {low && <IconAlert className="h-3.5 w-3.5" />}
                    {p.quantity_on_hand}
                  </span>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}

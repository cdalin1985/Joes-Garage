import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge } from "@/components/ui";
import { IconPlus, IconSearch } from "@/components/icons";
import { customerName } from "@/lib/display";
import type { Customer } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q?.trim();

  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  const customers = (data as Customer[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Everyone who brings a vehicle to the shop"
        actions={
          <Link href="/customers/new" className="btn-primary">
            <IconPlus className="h-4 w-4" /> New customer
          </Link>
        }
      />

      <form className="mb-4 flex max-w-md items-center gap-2" action="/customers">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name, company, phone, email…"
            className="input pl-9"
          />
        </div>
        <button className="btn-secondary">Search</button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>
      )}

      {customers.length === 0 ? (
        <EmptyState
          title={q ? "No matching customers" : "No customers yet"}
          description={q ? "Try a different search." : "Add your first customer to get started."}
          action={
            <Link href="/customers/new" className="btn-primary">
              <IconPlus className="h-4 w-4" /> New customer
            </Link>
          }
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Phone</th>
              <th>Email</th>
              <th>City</th>
            </tr>
          }
        >
          {customers.map((c) => (
            <tr key={c.id} className="cursor-pointer">
              <td>
                <Link href={`/customers/${c.id}`} className="font-medium text-brand-700 hover:underline">
                  {customerName(c)}
                </Link>
              </td>
              <td>
                {c.customer_type !== "individual" ? (
                  <Badge tone="purple">{c.customer_type}</Badge>
                ) : (
                  <span className="text-slate-400">Individual</span>
                )}
              </td>
              <td>{c.phone || c.mobile || "—"}</td>
              <td>{c.email || "—"}</td>
              <td>{c.city || "—"}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

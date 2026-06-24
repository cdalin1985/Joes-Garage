import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, Alert, SectionTitle } from "@/components/ui";
import { updateStaff } from "@/lib/actions/staff";
import { ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/format";
import type { Profile, UserRole } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const ROLE_TONE: Record<UserRole, "purple" | "blue" | "green" | "gray"> = {
  owner: "purple",
  admin: "blue",
  mechanic: "green",
  front_desk: "gray",
};

export default async function StaffPage() {
  const me = await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  const staff = (data as Profile[]) ?? [];

  return (
    <div>
      <PageHeader title="Staff" subtitle="Manage who can access the shop system" />

      <div className="mb-5">
        <Alert tone="blue" title="Adding a team member">
          Have them open the app and choose <strong>Create account</strong> on the sign-in screen.
          They&apos;ll start as Front Desk — come back here to set their role and pay rate.
        </Alert>
      </div>

      <div className="space-y-4">
        {staff.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3 lg:w-64">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {initials(p.full_name || p.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{p.full_name || "—"}</p>
                  <p className="truncate text-xs text-slate-400">{p.email}</p>
                </div>
                <div className="ml-auto lg:hidden">
                  <Badge tone={ROLE_TONE[p.role]}>{ROLE_LABELS[p.role]}</Badge>
                </div>
              </div>

              <form action={updateStaff.bind(null, p.id)} className="grid flex-1 gap-3 sm:grid-cols-5 sm:items-end">
                <label className="text-xs">
                  <span className="mb-1 block text-slate-500">Name</span>
                  <input name="full_name" defaultValue={p.full_name ?? ""} className="input !py-1.5" />
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-slate-500">Phone</span>
                  <input name="phone" defaultValue={p.phone ?? ""} className="input !py-1.5" />
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-slate-500">Role</span>
                  <select
                    name="role"
                    defaultValue={p.role}
                    className="input !py-1.5"
                    disabled={p.id === me.id}
                  >
                    {Object.entries(ROLE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-slate-500">Rate $/hr</span>
                  <input name="hourly_rate" type="number" step="0.01" defaultValue={p.hourly_rate ?? ""} className="input !py-1.5" />
                </label>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" name="is_active" defaultChecked={p.is_active} disabled={p.id === me.id} />
                    Active
                  </label>
                  <button className="btn-secondary !py-1.5 text-xs">Save</button>
                </div>
              </form>
            </div>
          </Card>
        ))}
      </div>

      {staff.length === 1 && (
        <div className="mt-5">
          <SectionTitle>Roles explained</SectionTitle>
          <ul className="space-y-1 text-sm text-slate-600">
            <li><strong>Owner / Admin</strong> — full access including accounting, reports, and settings.</li>
            <li><strong>Mechanic / Front Desk</strong> — customers, vehicles, estimates, invoices, and work orders (no financial reports).</li>
          </ul>
        </div>
      )}
    </div>
  );
}

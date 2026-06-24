"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { IconLogout } from "@/components/icons";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/database.types";

const MOBILE_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/work-orders", label: "Work Orders" },
  { href: "/estimates", label: "Estimates" },
  { href: "/invoices", label: "Invoices" },
  { href: "/customers", label: "Customers" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/parts", label: "Parts" },
  { href: "/appointments", label: "Appointments" },
  { href: "/accounting", label: "Accounting" },
  { href: "/accounting/reports", label: "Reports & Tax" },
  { href: "/settings", label: "Settings" },
  { href: "/staff", label: "Staff" },
];

export function Topbar({ name, role }: { name: string; role: UserRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-semibold text-slate-700 lg:hidden">Joe&apos;s Garage</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-700">{name}</p>
          <p className="text-xs leading-tight text-slate-400">{ROLE_LABELS[role]}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {initials(name)}
        </div>
        <button onClick={signOut} className="btn-ghost p-2" title="Sign out">
          <IconLogout className="h-[18px] w-[18px]" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-14 border-b border-slate-200 bg-white p-3 shadow-lg lg:hidden">
          <div className="grid grid-cols-2 gap-1">
            {MOBILE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

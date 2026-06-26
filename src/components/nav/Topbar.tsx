"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  IconLogout,
  IconPlus,
  IconSearch,
  IconWrench,
  IconEstimate,
  IconInvoice,
  IconUsers,
  IconCalculator,
  IconSettings,
} from "@/components/icons";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/database.types";

const QUICK_CREATE = [
  { href: "/work-orders/new", label: "Work order", icon: IconWrench, admin: false },
  { href: "/estimates/new", label: "Estimate", icon: IconEstimate, admin: false },
  { href: "/invoices/new", label: "Invoice", icon: IconInvoice, admin: false },
  { href: "/customers/new", label: "Customer", icon: IconUsers, admin: false },
  { href: "/accounting/new", label: "Expense", icon: IconCalculator, admin: true },
];

const MOBILE_LINKS = [
  { href: "/dashboard", label: "Dashboard", admin: false },
  { href: "/work-orders", label: "Work Orders", admin: false },
  { href: "/estimates", label: "Estimates", admin: false },
  { href: "/invoices", label: "Invoices", admin: false },
  { href: "/customers", label: "Customers", admin: false },
  { href: "/vehicles", label: "Vehicles", admin: false },
  { href: "/parts", label: "Parts", admin: false },
  { href: "/appointments", label: "Appointments", admin: false },
  { href: "/accounting", label: "Accounting", admin: true },
  { href: "/accounting/reports", label: "Reports & Tax", admin: true },
  { href: "/settings", label: "Settings", admin: true },
  { href: "/staff", label: "Staff", admin: true },
];

export function Topbar({
  name,
  role,
  isAdmin,
}: {
  name: string;
  role: UserRole;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [menu, setMenu] = useState<null | "mobile" | "new">(null);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const quick = QUICK_CREATE.filter((q) => !q.admin || isAdmin);
  const mobileLinks = MOBILE_LINKS.filter((l) => !l.admin || isAdmin);

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-x-0 border-t-0 border-b border-slate-200/70 px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        onClick={() => setMenu((m) => (m === "mobile" ? null : "mobile"))}
        aria-label="Menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>
      <span className="font-script text-3xl font-bold leading-none text-slate-800 lg:hidden">Joe&apos;s Garage</span>

      {/* Global search */}
      <form action="/customers" className="relative hidden max-w-md flex-1 sm:block">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          placeholder="Search customers…"
          className="w-full rounded-full border border-slate-200/80 bg-white/60 py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Quick create */}
        <div className="relative">
          <button
            onClick={() => setMenu((m) => (m === "new" ? null : "new"))}
            className="btn-primary !px-3"
          >
            <IconPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>
          {menu === "new" && (
            <>
              <button className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(null)} aria-hidden />
              <div className="absolute right-0 z-20 mt-2 w-52 animate-fade overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lift">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Create new
                </p>
                {quick.map((q) => {
                  const Icon = q.icon;
                  return (
                    <Link
                      key={q.href}
                      href={q.href}
                      onClick={() => setMenu(null)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 transition hover:bg-accent-50"
                    >
                      <span className="icon-chip h-7 w-7">
                        <Icon className="h-4 w-4" />
                      </span>
                      {q.label}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {isAdmin && (
          <Link href="/settings" className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block" title="Settings">
            <IconSettings className="h-[18px] w-[18px]" />
          </Link>
        )}

        <div className="hidden text-right md:block">
          <p className="text-sm font-semibold leading-tight text-slate-700">{name}</p>
          <p className="text-xs leading-tight text-slate-400">{ROLE_LABELS[role]}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-sm font-bold text-white shadow-sm ring-1 ring-brand-300/40">
          {initials(name)}
        </div>
        <button onClick={signOut} className="btn-ghost p-2" title="Sign out">
          <IconLogout className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* Mobile nav drawer */}
      {menu === "mobile" && (
        <div className="absolute left-0 right-0 top-16 z-20 animate-fade border-b border-slate-200 bg-white p-3 shadow-lift lg:hidden">
          <div className="grid grid-cols-2 gap-1">
            {mobileLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenu(null)}
                className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-accent-50"
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import {
  IconDashboard,
  IconUsers,
  IconCar,
  IconEstimate,
  IconInvoice,
  IconWrench,
  IconCalendar,
  IconPackage,
  IconCalculator,
  IconReport,
  IconSettings,
} from "@/components/icons";

type NavItem = { href: string; label: string; icon: (p: { className?: string }) => ReactNode };

const OPERATIONS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/work-orders", label: "Work Orders", icon: IconWrench },
  { href: "/estimates", label: "Estimates", icon: IconEstimate },
  { href: "/invoices", label: "Invoices", icon: IconInvoice },
  { href: "/appointments", label: "Appointments", icon: IconCalendar },
];

const CRM: NavItem[] = [
  { href: "/customers", label: "Customers", icon: IconUsers },
  { href: "/vehicles", label: "Vehicles", icon: IconCar },
  { href: "/parts", label: "Parts & Inventory", icon: IconPackage },
];

const ADMIN: NavItem[] = [
  { href: "/accounting", label: "Accounting", icon: IconCalculator },
  { href: "/accounting/reports", label: "Reports & Tax", icon: IconReport },
  { href: "/settings", label: "Settings", icon: IconSettings },
  { href: "/staff", label: "Staff", icon: IconUsers },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/accounting") return pathname === "/accounting";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-brand-sheen text-white shadow-md shadow-brand-950/40"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent-300 shadow-[0_0_8px_rgba(221,166,59,0.7)]" />
      )}
      <Icon
        className={clsx(
          "h-[18px] w-[18px] shrink-0 transition-transform duration-150",
          !active && "group-hover:scale-110",
        )}
      />
      {item.label}
    </Link>
  );
}

function Group({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((i) => (
          <NavLink key={i.href} item={i} />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({ isAdmin, shopName }: { isAdmin: boolean; shopName: string }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/20 bg-dark-sheen px-3 py-5 lg:flex">
      {/* faint ochre glow at the top for depth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent-500/10 to-transparent" />
      <Link href="/dashboard" className="relative mb-7 flex items-center gap-2.5 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-300 to-accent-500 font-display text-base font-black text-slate-900 shadow-lg ring-1 ring-accent-200/40">
          JG
        </span>
        <span className="truncate font-display text-lg font-bold tracking-tight text-white">
          {shopName}
        </span>
      </Link>
      <div className="relative flex-1 overflow-y-auto">
        <Group title="Operations" items={OPERATIONS} />
        <Group title="Records" items={CRM} />
        {isAdmin && <Group title="Back Office" items={ADMIN} />}
      </div>
      <div className="relative mt-2 border-t border-white/5 px-3 pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
          Joe&apos;s Garage · Shop OS
        </p>
      </div>
    </aside>
  );
}

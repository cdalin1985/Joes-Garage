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

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" &&
      item.href !== "/accounting" &&
      pathname.startsWith(item.href)) ||
    (item.href === "/accounting" && pathname === "/accounting");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-brand-600 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {item.label}
    </Link>
  );
}

function Group({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="mb-5">
      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <nav className="space-y-0.5">
        {items.map((i) => (
          <NavLink key={i.href} item={i} />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({ isAdmin, shopName }: { isAdmin: boolean; shopName: string }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 px-3 py-5 lg:flex">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-sm font-black text-white">
          JG
        </span>
        <span className="truncate font-bold text-white">{shopName}</span>
      </Link>
      <div className="flex-1 overflow-y-auto">
        <Group title="Operations" items={OPERATIONS} />
        <Group title="Records" items={CRM} />
        {isAdmin && <Group title="Back Office" items={ADMIN} />}
      </div>
    </aside>
  );
}

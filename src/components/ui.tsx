import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { BADGE_TONES } from "@/lib/constants";

type Tone = keyof typeof BADGE_TONES;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={clsx("badge", BADGE_TONES[tone])}>{children}</span>;
}

export function Card({
  children,
  className,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return <div className={clsx("card", pad && "card-pad", className)}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-1.5 inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            <span aria-hidden>←</span> Back
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <p className="text-base font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "slate",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "blue";
  icon?: ReactNode;
}) {
  const toneClass = {
    slate: "text-slate-900",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    blue: "text-brand-600",
  }[tone];
  const iconChip = {
    slate: "bg-slate-100 text-slate-500 ring-slate-200",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber: "bg-accent-50 text-accent-600 ring-accent-100",
    red: "bg-red-50 text-red-600 ring-red-100",
    blue: "bg-brand-50 text-brand-600 ring-brand-100",
  }[tone];
  const accentBar = {
    slate: "from-slate-300/0 via-slate-300 to-slate-300/0",
    green: "from-emerald-400/0 via-emerald-400 to-emerald-400/0",
    amber: "from-accent-400/0 via-accent-400 to-accent-400/0",
    red: "from-red-400/0 via-red-400 to-red-400/0",
    blue: "from-brand-400/0 via-brand-500 to-brand-400/0",
  }[tone];
  return (
    <Card className="card-hover group relative overflow-hidden">
      <span
        className={clsx(
          "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-70 transition-opacity group-hover:opacity-100",
          accentBar,
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className={clsx("mt-2 font-display text-[1.7rem] font-bold leading-tight tabular-nums", toneClass)}>
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {icon && (
          <span
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-200 group-hover:scale-110",
              iconChip,
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}

export function Field({
  label,
  children,
  hint,
  required,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function DataTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <Card pad={false} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>{head}</thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </Card>
  );
}

export function Alert({
  tone = "blue",
  title,
  children,
}: {
  tone?: "blue" | "amber" | "red" | "green";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    blue: "border-brand-200 bg-brand-50 text-brand-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <div className={clsx("rounded-lg border px-4 py-3 text-sm", tones[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5" : ""}>{children}</div>
    </div>
  );
}

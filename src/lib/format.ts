import { format, parseISO } from "date-fns";

export function formatCurrency(value: number | null | undefined): string {
  const n = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  const n = typeof value === "number" ? value : 0;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** 8.25% from a stored rate of 0.0825 */
export function formatPercent(rate: number | null | undefined): string {
  const n = typeof rate === "number" ? rate : 0;
  return `${(n * 100).toLocaleString("en-US", { maximumFractionDigits: 3 })}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = value.length <= 10 ? parseISO(value) : new Date(value);
    return format(d, "MMM d, yyyy");
  } catch {
    return value;
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "MMM d, yyyy h:mm a");
  } catch {
    return value;
  }
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return format(d, "yyyy-MM-dd");
}

/** Parse a currency/number string from a form into a number. */
export function toNumber(value: FormDataEntryValue | null, fallback = 0): number {
  if (value == null) return fallback;
  const n = parseFloat(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

import type { PricingMatrixTier } from "@/lib/database.types";

/**
 * Retail price for a given cost using the shop's pricing matrix.
 * Picks the tier whose range contains the cost (lower bound inclusive, upper
 * bound exclusive) and applies its markup multiplier. Returns null when no
 * tier matches or cost is not positive.
 */
export function priceFromMatrix(cost: number, tiers: PricingMatrixTier[]): number | null {
  if (!(cost > 0)) return null;
  const active = tiers.filter((t) => t.is_active).sort((a, b) => a.cost_min - b.cost_min);
  const tier = active.find((t) => cost >= t.cost_min && (t.cost_max == null || cost < t.cost_max));
  if (!tier) return null;
  return Math.round(cost * tier.markup_multiplier * 100) / 100;
}

/** Implied gross margin for a cost/price pair, as a 0–1 fraction. */
export function marginPct(cost: number, price: number): number {
  if (!(price > 0)) return 0;
  return (price - cost) / price;
}

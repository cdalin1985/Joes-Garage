"use client";

import { useState } from "react";
import { Field } from "@/components/ui";
import { priceFromMatrix, marginPct } from "@/lib/pricing";
import type { PricingMatrixTier } from "@/lib/database.types";

export function PartPricingFields({
  tiers,
  defaultCost,
  defaultPrice,
}: {
  tiers: PricingMatrixTier[];
  defaultCost?: number | null;
  defaultPrice?: number | null;
}) {
  const [cost, setCost] = useState(defaultCost != null ? String(defaultCost) : "");
  const [price, setPrice] = useState(defaultPrice != null ? String(defaultPrice) : "");

  const costNum = parseFloat(cost) || 0;
  const priceNum = parseFloat(price) || 0;
  const suggested = priceFromMatrix(costNum, tiers);
  const margin = priceNum > 0 ? marginPct(costNum, priceNum) : null;

  function onCost(next: string) {
    setCost(next);
    // Auto-fill price from the matrix while the price field is still empty/untouched-at-zero.
    const s = priceFromMatrix(parseFloat(next) || 0, tiers);
    if (s != null && (price === "" || parseFloat(price) === 0)) setPrice(String(s));
  }

  return (
    <>
      <Field label="Cost (you pay)">
        <input
          type="number"
          step="0.01"
          name="cost"
          value={cost}
          onChange={(e) => onCost(e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Price (customer pays)">
        <input
          type="number"
          step="0.01"
          name="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="input"
        />
        <div className="mt-1 flex items-center gap-2 text-xs">
          {suggested != null ? (
            <>
              <span className="text-slate-400">
                Matrix: <span className="font-medium text-slate-600">${suggested.toFixed(2)}</span>
              </span>
              {Math.abs(suggested - priceNum) > 0.005 && (
                <button
                  type="button"
                  onClick={() => setPrice(String(suggested))}
                  className="font-medium text-brand-600 hover:underline"
                >
                  apply
                </button>
              )}
            </>
          ) : (
            <span className="text-slate-300">Enter a cost for a matrix suggestion</span>
          )}
          {margin != null && priceNum > 0 && (
            <span className="ml-auto text-slate-400">margin {(margin * 100).toFixed(0)}%</span>
          )}
        </div>
      </Field>
    </>
  );
}

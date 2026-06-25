"use client";

import { useState } from "react";
import { Field } from "@/components/ui";
import { PAYMENT_METHODS } from "@/lib/constants";
import { todayISO } from "@/lib/format";

export function PaymentForm({
  action,
  balanceDue,
}: {
  action: (formData: FormData) => void | Promise<void>;
  balanceDue: number;
}) {
  const [amount, setAmount] = useState(balanceDue > 0 ? balanceDue.toFixed(2) : "");

  return (
    <form action={action} className="space-y-3 print:hidden">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount" required>
          <input
            name="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
            required
          />
        </Field>
        <Field label="Method">
          <select name="method" defaultValue="card" className="input">
            {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input name="paid_at" type="date" defaultValue={todayISO()} className="input" />
        </Field>
        <Field label="Reference">
          <input name="reference" className="input" placeholder="Check #, last 4, etc." />
        </Field>
      </div>
      <button className="btn-primary w-full">Record payment</button>
    </form>
  );
}

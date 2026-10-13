"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { enterWithPin, type PinState } from "@/lib/actions/pin-auth";

const initial: PinState = { error: null };

function EnterButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="btn-primary w-full justify-center disabled:opacity-50"
    >
      {pending ? "Opening…" : "Enter"}
    </button>
  );
}

export function PinPad() {
  const [pin, setPin] = useState("");
  const [state, formAction] = useFormState(enterWithPin, initial);

  const press = (d: string) => setPin((p) => (p.length >= 8 ? p : p + d));
  const back = () => setPin((p) => p.slice(0, -1));
  const clear = () => setPin("");

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="card-pad">
      <div className="mb-5 text-center">
        <p className="text-sm font-medium text-slate-500">Welcome back</p>
        <p className="text-lg font-semibold text-slate-800">Enter your shop PIN</p>
      </div>

      {/* PIN dots */}
      <div className="mb-5 flex justify-center gap-2">
        {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${i < pin.length ? "bg-brand-600" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className="rounded-xl border border-slate-200 bg-white py-3.5 text-xl font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            {k}
          </button>
        ))}
        <button type="button" onClick={clear} className="rounded-xl py-3.5 text-sm font-medium text-slate-400 hover:text-slate-600">
          Clear
        </button>
        <button
          type="button"
          onClick={() => press("0")}
          className="rounded-xl border border-slate-200 bg-white py-3.5 text-xl font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
        >
          0
        </button>
        <button type="button" onClick={back} className="rounded-xl py-3.5 text-sm font-medium text-slate-400 hover:text-slate-600">
          ⌫
        </button>
      </div>

      {state.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">{state.error}</p>
      )}

      <form action={formAction} className="mt-4">
        <input type="hidden" name="pin" value={pin} />
        <EnterButton disabled={pin.length < 3} />
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        <Link href="/login?staff=1" className="hover:text-slate-600 hover:underline">
          Staff sign-in with email &amp; password
        </Link>
      </p>
    </div>
  );
}

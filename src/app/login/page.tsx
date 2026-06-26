"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <div className="card-pad text-center">
        <p className="text-slate-700">This app isn&apos;t connected to a database yet.</p>
        <Link href="/setup" className="btn-primary mt-4">
          View setup instructions
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setInfo("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        setLoading(false);
      }
    }
  }

  return (
    <div className="card-pad">
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-lg py-2 font-semibold transition-colors ${
            mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg py-2 font-semibold transition-colors ${
            mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Joe Mechanic"
              required
            />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@joesgarage.com"
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {mode === "signup" && (
        <p className="mt-4 text-center text-xs text-slate-400">
          The first account created becomes the shop owner.
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 px-6 py-12">
      {/* Ambient floating glow orbs */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-400/10 blur-3xl" />

      <div className="relative w-full max-w-sm animate-rise">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-300 to-accent-500 font-display text-2xl font-black text-slate-900 shadow-[0_8px_30px_-6px_rgba(221,166,59,0.5)] ring-1 ring-accent-200/50">
            JG
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Joe&apos;s Garage</h1>
          <p className="mt-1 text-sm text-slate-400">Shop Management Platform</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/95 p-1 shadow-2xl backdrop-blur-xl">
          <Suspense fallback={<div className="card-pad text-center text-slate-500">Loading…</div>}>
            <LoginInner />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Joe&apos;s Garage · Shop OS
        </p>
      </div>
    </main>
  );
}

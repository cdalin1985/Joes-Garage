import { Suspense } from "react";
import { PinPad } from "@/components/forms/PinPad";
import { EmailPasswordLogin } from "@/components/forms/EmailPasswordLogin";
import { pinLoginEnabled } from "@/lib/shop-pin";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { staff?: string } }) {
  const pinAvailable = pinLoginEnabled();
  const showPin = pinAvailable && searchParams.staff !== "1";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 px-6 py-12">
      {/* Ambient floating glow orbs */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-400/10 blur-3xl" />

      <div className="relative w-full max-w-sm animate-rise">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-300 to-accent-500 font-display text-2xl font-bold tracking-tight text-slate-900 shadow-[0_8px_30px_-6px_rgba(221,166,59,0.5)] ring-1 ring-accent-200/50">
            JG
          </div>
          <h1 className="font-script text-7xl font-bold leading-tight text-white">Joe&apos;s Garage</h1>
          <p className="mt-1 text-sm text-slate-400">Shop Management Platform</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/95 p-1 shadow-2xl backdrop-blur-xl">
          {showPin ? (
            <PinPad />
          ) : (
            <Suspense fallback={<div className="card-pad text-center text-slate-500">Loading…</div>}>
              <EmailPasswordLogin pinAvailable={pinAvailable} />
            </Suspense>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Joe&apos;s Garage · Shop OS
        </p>
      </div>
    </main>
  );
}

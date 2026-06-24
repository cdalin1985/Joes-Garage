"use client";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <div className="card card-pad">
        <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">
          {error.message || "An unexpected error occurred."}
        </p>
        <button onClick={reset} className="btn-primary mt-4">
          Try again
        </button>
      </div>
    </div>
  );
}

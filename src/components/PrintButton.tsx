"use client";

export function PrintButton({ label = "Print / PDF" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn-secondary print:hidden">
      {label}
    </button>
  );
}

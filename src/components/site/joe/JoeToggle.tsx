"use client";

import { useEffect, useState } from "react";

const KEY = "joes-hidden";

/** Small pill that hides (or brings back) every Joe for the rest of the visit. */
export function JoeToggle() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => setHidden(document.documentElement.classList.contains("joe-hidden")), []);

  const toggle = () => {
    const next = !hidden;
    document.documentElement.classList.toggle("joe-hidden", next);
    try {
      if (next) sessionStorage.setItem(KEY, "1");
      else sessionStorage.removeItem(KEY);
    } catch {}
    setHidden(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      data-testid="joe-toggle"
      className="fixed bottom-4 left-4 z-[56] inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white sm:bottom-5 sm:left-5"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {!hidden && <path d="M4 4l16 16" />}
      </svg>
      {hidden ? "Show Joe" : "Hide Joe"}
    </button>
  );
}

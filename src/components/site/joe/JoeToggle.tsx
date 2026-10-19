"use client";

import { JOE_HIDDEN_EVENT, type JoeHiddenDetail } from "./events";

const CLS = {
  header:
    "inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 px-2.5 text-xs font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b3f]/70 lg:px-3",
  menu: "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-base font-semibold text-slate-200 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b3f]/70",
};

/** Hide every Joe for the rest of the visit (they fade out together), or show them again. */
function toggle() {
  const root = document.documentElement;
  if (root.classList.contains("joe-leaving")) return;
  const hide = !root.classList.contains("joe-hidden");
  try {
    // Hiding uses up the hero's hello too, so showing him again never waves.
    if (hide) (sessionStorage.setItem("joes-hidden", "1"), sessionStorage.setItem("joes-hello", "1"));
    else sessionStorage.removeItem("joes-hidden");
  } catch {}
  window.dispatchEvent(new CustomEvent<JoeHiddenDetail>(JOE_HIDDEN_EVENT, { detail: { hidden: hide } }));
  if (hide) {
    root.classList.add("joe-leaving");
    window.setTimeout(() => (root.classList.add("joe-hidden"), root.classList.remove("joe-leaving")), 220);
  } else {
    root.classList.remove("joe-hidden");
    root.classList.add("joe-arriving");
    window.setTimeout(() => root.classList.remove("joe-arriving"), 420);
  }
}

/**
 * The Hide Joe switch, in the header (`header`) or the phone menu (`menu`).
 * No React state: the label comes from CSS (.joe-hidden), so the button never
 * changes width and never mismatches on hydration.
 */
export function JoeToggle({ variant }: { variant: "header" | "menu" }) {
  return (
    <button type="button" onClick={toggle} data-testid={variant === "header" ? "joe-toggle" : "joe-toggle-menu"} className={CLS[variant]}>
      <svg
        viewBox="0 0 24 24"
        className={variant === "header" ? "h-3.5 w-3.5" : "h-4 w-4"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        <path data-joe-slash d="M4 4l16 16" />
      </svg>
      <span className={`grid ${variant === "header" ? "sr-only lg:not-sr-only" : ""}`}>
        <span data-joe-label="hide" className="[grid-area:1/1]">
          Hide Joe
        </span>
        <span data-joe-label="show" className="[grid-area:1/1]">
          Show Joe
        </span>
      </span>
    </button>
  );
}

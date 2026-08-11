"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site-config";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-300 to-accent-500 font-display text-base font-bold text-slate-900 shadow-lg ring-1 ring-accent-200/40 transition-transform duration-200 group-hover:rotate-[-6deg]">
            JG
          </span>
          <span className="font-script text-4xl leading-none text-white">{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {n.label}
            </Link>
          ))}
          <a href={`tel:${site.phoneHref}`} className="btn-accent ml-2 !rounded-lg">
            {site.phone}
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white md:hidden"
        >
          <span className="relative block h-4 w-5">
            <span className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>

      {open && (
        <div className="animate-fade border-t border-white/10 px-5 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-semibold text-slate-200 hover:bg-white/5"
              >
                {n.label}
              </Link>
            ))}
            <a href={`tel:${site.phoneHref}`} className="btn-accent mt-2 w-full justify-center">
              Call {site.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site-config";
import { BrandMark } from "./BrandMark";
import { JoeToggle } from "./joe/JoeToggle";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0a0908]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2.5">
        <Link href="/" className="group" onClick={() => setOpen(false)} aria-label={`${site.name} home`}>
          <BrandMark />
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
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/10" />
          <JoeToggle variant="header" />
          <a href={`tel:${site.phoneHref}`} className="btn-ignite ml-3 !rounded-xl !px-4 !py-2 text-sm">
            {site.phone}
          </a>
        </nav>

        <a
          href={`tel:${site.phoneHref}`}
          aria-label={`Call ${site.phone}`}
          className="btn-ignite ml-auto !rounded-xl !p-0 h-10 w-10 md:!hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
          </svg>
        </a>
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
            <JoeToggle variant="menu" />
            <a href={`tel:${site.phoneHref}`} className="btn-ignite mt-2 w-full">
              Call {site.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

import { ScrollReveal } from "@/components/site/fx/ScrollReveal";
import { SectionEyebrow } from "./SectionEyebrow";

const ROWS = [
  { tone: "bg-red-500", glow: "shadow-[0_0_14px_rgba(239,68,68,0.9)]", pulse: true, label: "Front brake pads at 2mm", note: "Needs attention now" },
  { tone: "bg-amber-400", glow: "shadow-[0_0_14px_rgba(251,191,36,0.9)]", pulse: true, label: "Serpentine belt cracking", note: "Plan for it soon" },
  { tone: "bg-emerald-500", glow: "", pulse: false, label: "Battery tested strong", note: "Looks good" },
  { tone: "bg-emerald-500", glow: "", pulse: false, label: 'Tires 7/32" even wear', note: "Looks good" },
];

/** The photo-inspection pitch, shown on a phone that's being "scanned". */
export function Inspection() {
  return (
    <section id="inspection" className="relative overflow-hidden bg-[#12100e] py-28 text-white">
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-[#7fdcff]/10 blur-3xl" />
      <ScrollReveal className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2">
        <div>
          <SectionEyebrow>See what we see</SectionEyebrow>
          <h2 data-reveal className="mega text-[clamp(2.6rem,5.6vw,5rem)]">
            <span className="text-chrome">Photos of the problem.</span>{" "}
            <span className="text-fire">Before you say go.</span>
          </h2>
          <p data-reveal className="mt-6 text-lg leading-relaxed text-white/65">
            You should never have to take a mechanic&apos;s word for it. Your vehicle gets photographed
            during inspection and every item is rated <span className="font-semibold text-emerald-400">green</span>,{" "}
            <span className="font-semibold text-amber-300">yellow</span>, or{" "}
            <span className="font-semibold text-red-400">red</span>. You get a link on your phone, look at
            the worn part yourself, and decide with real information in front of you.
          </p>
          <p data-reveal className="mt-4 leading-relaxed text-white/55">
            Green means it&apos;s fine. Yellow means keep an eye on it. Red means let&apos;s talk.
          </p>
        </div>

        <div data-reveal className="mx-auto w-full max-w-sm">
          <div className="relative rounded-[2.6rem] border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(127,220,255,0.35)]">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0a0908] px-4 pb-6 pt-10">
              <span className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Vehicle inspection</p>
              <p className="mt-1 font-display text-lg font-bold">4 items checked</p>
              <ul className="mt-5 space-y-2.5">
                {ROWS.map((r) => (
                  <li key={r.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.tone} ${r.glow} ${r.pulse ? "pulse-dot" : ""}`} />
                    <span className="flex-1 text-sm font-medium">{r.label}</span>
                    <span className="text-[11px] text-white/55">{r.note}</span>
                  </li>
                ))}
              </ul>
              <span className="scanline" aria-hidden="true" />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/** Small red label above a section heading; decodes itself inside ScrollReveal. */
export function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3f]">
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#ff3b3f]" aria-hidden="true" />
      <span data-scramble>{children}</span>
    </p>
  );
}

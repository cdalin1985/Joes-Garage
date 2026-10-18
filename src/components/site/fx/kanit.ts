/**
 * Kanit's family name for canvas text. The 3D plug's label is drawn on a
 * canvas, which can't read CSS variables, and next/font renames the family
 * (e.g. "'__Kanit_1a2b3c', '__Kanit_Fallback_1a2b3c'"). The real name is on
 * <html> as --nf-kanit (src/app/layout.tsx).
 */
export function kanitFamily(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--nf-kanit").trim() || "Kanit";
}

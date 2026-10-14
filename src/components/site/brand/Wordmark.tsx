import { WORDMARK_PARTS, WORDMARK_VIEWBOX } from "./wordmark-paths";

/**
 * Joe's red "JOE'S AUTO GARAGE / 406-577-6663" wordmark as inline SVG.
 * Each part carries `data-part` (joes · wrench · auto · garage · phone) so
 * the hero can animate them individually. On dark backgrounds the black
 * wrench and phone number switch to white via --logo-ink.
 */
export function Wordmark({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const vars = {
    "--logo-red": tone === "dark" ? "#e3121b" : "#cf0a14",
    "--logo-ink": tone === "dark" ? "#f4f4f2" : "#111111",
  } as React.CSSProperties;
  return (
    <svg viewBox={WORDMARK_VIEWBOX} className={className} style={vars} aria-hidden="true" data-wordmark>
      {WORDMARK_PARTS.map((p) => (
        <path
          key={p.id}
          data-part={p.id}
          fill={p.tone === "red" ? "var(--logo-red)" : "var(--logo-ink)"}
          fillRule="evenodd"
          d={p.d}
        />
      ))}
    </svg>
  );
}

import { site } from "@/lib/site-config";

/**
 * Header/footer lockup: a small chrome spark plug (Joe's logo) beside the
 * shop name set in the same condensed block style as the logo lettering.
 */
export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  const plug = size === "lg" ? "h-14" : "h-11";
  const text = size === "lg" ? "text-3xl" : "text-2xl";
  return (
    <span className="flex items-center gap-2.5">
      <span className={`plug block shrink-0 ${plug} rotate-[-14deg] transition-transform duration-300 group-hover:rotate-[8deg]`} aria-hidden="true">
        <span className="plug-mask plug-chrome" />
      </span>
      <span className="leading-none">
        <span className={`mega block ${text} text-white`}>{site.name}</span>
        <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.32em] text-[#ff3b3f]">
          {site.address.city}, Montana
        </span>
      </span>
    </span>
  );
}

"use client";

import { JoeSlot } from "./JoeSlot";
import type { JoeArtName } from "./art";

/** Which prop Joe holds on each service page; other services get his wrench. */
const SERVICE_ART: Record<string, JoeArtName> = {
  "brake-repair": "rotor",
  "oil-change": "oilCan",
  "batteries-and-electrical": "battery",
  tires: "tire",
  "suspension-and-alignment": "tire",
};

/** Joe standing at the bottom-right of a service page hero, holding a fitting prop. */
export function ServiceJoe({ slug }: { slug: string }) {
  const art = SERVICE_ART[slug] ?? "base";
  return (
    <div
      className="pointer-events-none absolute -bottom-16 right-5 hidden h-72 sm:-bottom-20 lg:block xl:h-80"
      data-testid="service-joe-wrap"
      data-prop={art === "base" ? "wrench" : art}
    >
      <JoeSlot art={art} behavior="service" testId="service-joe" label="Joe — tap to say hi" />
    </div>
  );
}

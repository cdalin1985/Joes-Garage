"use client";

import { JoeSlot } from "./JoeSlot";

/** Joe standing at the foot of the spark plug, waving hello. */
export function HeroJoe() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-[20svh] -translate-x-[10%] sm:h-[30svh] lg:h-[50svh] lg:-translate-x-[62%]">
      <JoeSlot art="base" behavior="hero" eager testId="hero-joe" label="Joe, the owner — tap to say hi" />
    </div>
  );
}

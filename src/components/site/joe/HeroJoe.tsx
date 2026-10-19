"use client";

import { JoeSlot } from "./JoeSlot";

/** Joe standing at the foot of the spark plug; on wider screens he stands clear of the hero's buttons. */
export function HeroJoe() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-[20svh] -translate-x-[10%] sm:h-[30svh] lg:h-[42svh] lg:-translate-x-[34%] xl:h-[50svh] xl:-translate-x-[62%]">
      <JoeSlot art="base" behavior="hero" eager testId="hero-joe" label="Joe, the owner — tap to say hi" />
    </div>
  );
}

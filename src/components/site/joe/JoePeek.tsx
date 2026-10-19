"use client";

import { JoeSlot } from "./JoeSlot";

/**
 * Joe "over the counter" in the bottom-left corner (see peek.ts). Renders no
 * photo until he's needed; with reduced motion the animation never loads, so
 * he never appears.
 */
export function JoePeek() {
  return (
    <JoeSlot
      art="base"
      behavior="peek"
      interactive={false}
      observe={false}
      still={false}
      floor={false}
      testId="joe-peek"
      label=""
      className="!fixed bottom-0 left-0 z-[55] !h-52 opacity-0 pointer-events-none sm:!h-60 lg:!h-72"
    />
  );
}

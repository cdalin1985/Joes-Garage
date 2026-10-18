"use client";

import { JoeSlot } from "./JoeSlot";

/**
 * Small Joe who slides in from the left edge (see peek.ts). Starts invisible;
 * with reduced motion the animation never loads, so he never appears.
 */
export function JoePeek() {
  return (
    <JoeSlot
      art="base"
      behavior="peek"
      interactive={false}
      observe={false}
      testId="joe-peek"
      label=""
      className="!fixed bottom-24 left-0 z-[55] !h-36 opacity-0 pointer-events-none sm:!h-44 lg:bottom-auto lg:top-[42%] lg:!h-60"
    />
  );
}

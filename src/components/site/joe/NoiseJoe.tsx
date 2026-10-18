"use client";

import { JoeSlot } from "./JoeSlot";

/** Desktop Joe beside the "What's that noise?" heading; acts out each example sound. */
export function NoiseJoe() {
  return (
    <div className="pointer-events-none absolute bottom-full right-5 hidden h-72 lg:block xl:h-80" data-testid="noise-joe-wrap">
      <JoeSlot art="base" behavior="noise" testId="noise-joe" label="Joe — tap to say hi" />
    </div>
  );
}

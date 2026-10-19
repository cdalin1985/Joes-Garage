/** Joe's motion tokens. Every tween in joe/ uses these and nothing else. */
export const DUR = { snap: 0.09, quick: 0.22, base: 0.42, slow: 0.7 } as const;
export const EASE = { out: "expo.out", inOut: "sine.inOut", in: "power2.in" } as const;
/** His boots: the ground line is at 900/916 px on every pose. */
export const ORIGIN = "50% 98%";
export const REST = { xPercent: 0, yPercent: 0, rotation: 0 } as const;

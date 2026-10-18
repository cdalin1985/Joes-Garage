"use client";

import { useRef } from "react";
import { gsap, useGSAP, DOOR_OPEN_EVENT } from "./gsap";

/**
 * First-visit intro on the home page: the shop's roll-up door, light leaking
 * under it, rolls open to reveal the site. About 1.5s; click to skip.
 *
 * It only shows when the boot script added `fx-intro` to <html> (home page,
 * first visit this session, motion allowed). Otherwise it renders hidden.
 */
export function GarageDoor({ name, place }: { name: string; place: string }) {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const html = document.documentElement;
      if (!html.classList.contains("fx-intro")) return;
      const q = gsap.utils.selector(root);
      const open = () => {
        html.classList.remove("fx-intro");
        try {
          sessionStorage.setItem("joes-door", "1");
        } catch {
          /* private mode: the door just shows again next visit */
        }
        window.dispatchEvent(new Event(DOOR_OPEN_EVENT));
      };
      tl.current = gsap
        .timeline({ delay: 0.25 })
        .fromTo(q(".door-name"), { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" })
        .fromTo(q(".door-gap"), { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: "power2.out" }, "<0.1")
        .to(q(".door-gap"), { opacity: 0.55, duration: 0.06, repeat: 3, yoyo: true }, ">")
        .to(q(".door-panel"), { yPercent: -100, duration: 0.85, ease: "power3.inOut" }, ">-0.05")
        // Rides up with the door to its top edge (transforms only: no layout shift).
        .to(
          q(".door-gap"),
          { y: () => -(root.current?.clientHeight ?? window.innerHeight), opacity: 0, duration: 0.85, ease: "power3.inOut" },
          "<",
        )
        .add(open, "<0.45")
        .set(root.current, { display: "none" });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="door"
      aria-hidden="true"
      onClick={() => tl.current?.timeScale(4)}
    >
      <div className="door-panel flex flex-col items-center justify-center gap-3 text-center">
        <div className="door-name">
          <p className="mega text-chrome text-[clamp(3rem,13vw,10rem)]">{name}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.4em] text-white/50">{place}</p>
        </div>
        <span className="absolute bottom-[12%] left-1/2 h-3 w-28 -translate-x-1/2 rounded-full bg-black/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
      </div>
      <div className="door-gap" />
    </div>
  );
}

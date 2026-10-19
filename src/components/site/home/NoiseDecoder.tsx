"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ADD_SYMPTOM_EVENT, URGENCY_LABEL, symptoms, type Symptom, type Urgency } from "@/lib/symptoms";
import { playSymptom, previewSample, type Playback } from "@/components/site/fx/noise-synth";
import { prefersReducedMotion } from "@/components/site/fx/gsap";
import { tellJoe } from "@/components/site/joe/events";

const URGENCY_TONE: Record<Urgency, string> = {
  now: "bg-[#ff3b3f] text-white",
  soon: "bg-[#ffb020] text-[#1a1208]",
  check: "bg-[#7fdcff] text-[#06202b]",
};

const URGENCY_DOT: Record<Urgency, string> = {
  now: "bg-[#ff3b3f] shadow-[0_0_10px_#ff3b3f]",
  soon: "bg-[#ffb020] shadow-[0_0_10px_#ffb020]",
  check: "bg-[#7fdcff] shadow-[0_0_10px_#7fdcff]",
};

/**
 * Oscilloscope trace. Shows the live analyser while a sound plays, otherwise
 * a looping "shape" of the symptom (a still frame when motion is reduced).
 */
function Scope({ kind, live, playing }: { kind: Symptom["sound"]; live: React.RefObject<Playback | null>; playing: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const reduce = prefersReducedMotion();
    const buf = new Float32Array(1024);
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(c);

    const draw = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);

      g.strokeStyle = "rgba(127,220,255,0.08)";
      g.lineWidth = 1;
      g.beginPath();
      for (let i = 1; i < 10; i++) {
        g.moveTo((w / 10) * i, 0);
        g.lineTo((w / 10) * i, h);
      }
      for (let i = 1; i < 6; i++) {
        g.moveTo(0, (h / 6) * i);
        g.lineTo(w, (h / 6) * i);
      }
      g.stroke();

      const an = live.current?.analyser;
      const color = an ? "#ff3b3f" : "#7fdcff";
      g.beginPath();
      if (an) {
        an.getFloatTimeDomainData(buf);
        const n = 512;
        // Auto-gain so quiet sounds still fill the screen.
        let peak = 0.02;
        for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(buf[i]));
        const gain = Math.min(8, 0.9 / peak);
        for (let i = 0; i < n; i++) {
          const x = (i / (n - 1)) * w;
          const y = h / 2 - Math.max(-1, Math.min(1, buf[i] * gain)) * h * 0.45;
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
      } else {
        const t = reduce ? 0.4 : now / 1000;
        const n = 260;
        for (let i = 0; i <= n; i++) {
          const x = i / n;
          const y = h / 2 - previewSample(kind, x, t) * h * 0.42;
          if (i) g.lineTo(x * w, y);
          else g.moveTo(0, y);
        }
      }
      g.strokeStyle = color;
      g.lineWidth = 2;
      g.shadowColor = color;
      g.shadowBlur = 12;
      g.stroke();
      g.shadowBlur = 0;
    };

    if (reduce && !playing) {
      draw(0);
    } else {
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        if (visible && !document.hidden) draw(now);
      };
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [kind, live, playing]);

  return <canvas ref={canvas} className="h-28 w-full sm:h-32" aria-hidden="true" />;
}

/**
 * "What's that noise?" — pick a symptom, hear a synthesized example, see what
 * usually causes it and which service covers it. General guidance only.
 */
export function NoiseDecoder({ serviceNames }: { serviceNames: Record<string, string> }) {
  const [active, setActive] = useState(symptoms[0].id);
  const [playing, setPlaying] = useState(false);
  const live = useRef<Playback | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const s = symptoms.find((x) => x.id === active) ?? symptoms[0];

  const stop = () => {
    window.clearTimeout(timer.current);
    live.current?.stop();
    live.current = null;
    setPlaying(false);
    tellJoe(null);
  };

  // Silence any example still playing when the section unmounts.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      live.current?.stop();
    },
    [],
  );

  const pick = (id: string) => {
    stop();
    setActive(id);
    // The check-engine light has no sound, so Joe reacts now; otherwise he just gets the pose ready.
    const sound = symptoms.find((x) => x.id === id)?.sound;
    if (sound === "none") tellJoe("none");
    else if (sound) tellJoe(sound, true);
  };

  const hear = () => {
    stop();
    const p = playSymptom(s.sound);
    if (!p) return;
    live.current = p;
    setPlaying(true);
    tellJoe(s.sound);
    timer.current = window.setTimeout(stop, (p.endsAt - p.ctx.currentTime) * 1000 + 120);
  };

  const addToText = () => {
    window.dispatchEvent(new CustomEvent(ADD_SYMPTOM_EVENT, { detail: { id: s.id } }));
    document.getElementById("text-joe")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1" role="group" aria-label="Pick what your vehicle is doing">
        {symptoms.map((x) => {
          const on = x.id === active;
          return (
            <button
              key={x.id}
              type="button"
              aria-pressed={on}
              onClick={() => pick(x.id)}
              className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[0.95rem] font-semibold transition-colors ${
                on
                  ? "border-[#ff3b3f]/70 bg-[#ff3b3f]/[0.12] text-white"
                  : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white"
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${URGENCY_DOT[x.urgency]}`} aria-hidden="true" />
              <span className="flex-1">{x.label}</span>
              <span
                className={`text-lg leading-none transition-transform ${on ? "translate-x-0 text-[#ff3b3f]" : "-translate-x-1 text-white/25 group-hover:translate-x-0"}`}
                aria-hidden="true"
              >
                →
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0c0b] p-6 sm:p-8" aria-live="polite">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_220px_at_85%_0%,rgba(227,18,27,0.16),transparent_70%)]" />
        <div key={s.id} className="decode-in relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${URGENCY_TONE[s.urgency]}`}>
              {URGENCY_LABEL[s.urgency]}
            </span>
          </div>
          <h3 className="mega mt-4 text-[clamp(2rem,4vw,3rem)] text-white">{s.label}</h3>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#7fdcff]/15 bg-black/50">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-white/40">
              <span>{playing ? "Live" : "Signature"}</span>
              <span className={playing ? "text-[#ff3b3f]" : ""}>{playing ? "● Playing" : s.sound === "none" ? "Dash light" : "Ready"}</span>
            </div>
            <Scope kind={s.sound} live={live} playing={playing} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {s.sound !== "none" ? (
              <button
                type="button"
                onClick={playing ? stop : hear}
                onPointerEnter={() => tellJoe(s.sound, true)}
                onFocus={() => tellJoe(s.sound, true)}
                className="btn-ghost-ign"
              >
                {playing ? (
                  <>
                    <span aria-hidden="true">■</span> Stop
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">▶</span> Hear an example
                  </>
                )}
              </button>
            ) : (
              <p className="text-sm text-white/55">No sound for this one — it&apos;s a light on the dash.</p>
            )}
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.25em] text-white/45">Usually means</p>
          <ul className="mt-3 space-y-2.5">
            {s.causes.map((c) => (
              <li key={c} className="flex gap-3 text-white/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[#ff3b3f]" aria-hidden="true" />
                <span>{c}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 border-l-2 border-[#ff3b3f] pl-4 text-white/75">{s.advice}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={addToText} className="btn-ignite">
              Add this to my text
            </button>
            <Link href={`/services/${s.serviceSlug}`} className="btn-ghost-ign">
              {serviceNames[s.serviceSlug] ?? "See the service"} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

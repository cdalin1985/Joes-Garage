"use client";

import { useEffect, useRef, useState } from "react";
import { ADD_SYMPTOM_EVENT, symptoms } from "@/lib/symptoms";

const DAYS = ["First available", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ford", "GMC",
  "Honda", "Hyundai", "Jeep", "Kia", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "Mitsubishi",
  "Nissan", "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

const field =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/30 focus:border-[#ff3b3f] focus:outline-none focus:ring-2 focus:ring-[#ff3b3f]/30";
const label = "mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-white/50";

type Props = { shopName: string; phone: string; phoneHref: string; email: string };

/**
 * Builds a service-request message from a few fields and hands it to the
 * visitor's own texting or email app. Nothing is sent from the site itself.
 */
export function TextJoe({ shopName, phone, phoneHref, email }: Props) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [day, setDay] = useState(DAYS[0]);
  const [copied, setCopied] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<number | undefined>(undefined);
  const first = useRef(true);

  // The decoder above can drop a symptom in here.
  useEffect(() => {
    const add = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (id) setPicked((p) => (p.includes(id) ? p : [...p, id]));
    };
    window.addEventListener(ADD_SYMPTOM_EVENT, add);
    return () => window.removeEventListener(ADD_SYMPTOM_EVENT, add);
  }, []);

  const car = [year, make, model].map((v) => v.trim()).filter(Boolean).join(" ");
  const doing = [...symptoms.filter((s) => picked.includes(s.id)).map((s) => s.phrase), details.trim()].filter(Boolean);
  const lines = [name.trim() ? `Hi, this is ${name.trim()}.` : "Hi there."];
  if (car) lines.push(`Vehicle: ${car}`);
  if (doing.length) lines.push(`What it's doing: ${doing.join("; ")}`);
  lines.push(`Best day to bring it in: ${day}`);
  const message = lines.join("\n");

  // Show "typing…" in the phone for a beat after every change.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTyping(false), 450);
    return () => window.clearTimeout(typingTimer.current);
  }, [message]);

  const smsHref = `sms:${phoneHref}?&body=${encodeURIComponent(message)}`;
  const subject = `Service request${car ? ` — ${car}` : ""}`;
  const mailHref = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
      <form className="grid gap-5" onSubmit={(e) => e.preventDefault()} aria-label="Build your message">
        <div>
          <label htmlFor="tj-name" className={label}>
            Your name
          </label>
          <input id="tj-name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="First name is fine" />
        </div>

        <fieldset>
          <legend className={label}>Your vehicle</legend>
          <div className="grid grid-cols-[5.5rem_1fr] gap-3 sm:grid-cols-[6rem_1fr_1fr]">
            <input
              aria-label="Year"
              className={field}
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              placeholder="Year"
            />
            <input aria-label="Make" className={field} value={make} onChange={(e) => setMake(e.target.value)} list="tj-makes" placeholder="Make" />
            <input
              aria-label="Model"
              className={`${field} col-span-2 sm:col-span-1`}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model"
            />
            <datalist id="tj-makes">
              {MAKES.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
        </fieldset>

        <fieldset>
          <legend className={label}>What&apos;s it doing?</legend>
          <div className="flex flex-wrap gap-2">
            {symptoms.map((s) => {
              const on = picked.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.id)}
                  className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-all ${
                    on
                      ? "scale-[1.03] border-[#ff3b3f] bg-[#ff3b3f] text-white shadow-[0_0_18px_rgba(255,59,63,0.45)]"
                      : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/35 hover:text-white"
                  }`}
                >
                  {on ? "✓ " : "+ "}
                  {s.label}
                </button>
              );
            })}
          </div>
          <textarea
            aria-label="Anything else"
            className={`${field} mt-3 min-h-[5.5rem] resize-y`}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Anything else? When it happens, how long it's been going on…"
          />
        </fieldset>

        <div>
          <label htmlFor="tj-day" className={label}>
            Best day to bring it in
          </label>
          <div className="relative">
            <select id="tj-day" className={`${field} appearance-none pr-10`} value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d} className="bg-[#12100e]">
                  {d}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50" aria-hidden="true">
              ▾
            </span>
          </div>
        </div>
      </form>

      {/* The phone */}
      <div className="lg:sticky lg:top-28">
        <div className="relative mx-auto w-full max-w-[22rem] rounded-[2.6rem] border border-white/15 bg-gradient-to-b from-[#1b1917] to-[#0b0a09] p-3 shadow-[0_30px_80px_-20px_rgba(227,18,27,0.45)]">
          <div className="rounded-[2.1rem] bg-[#050505] px-4 pb-5 pt-3">
            <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-black ring-1 ring-white/10" aria-hidden="true" />
            <div className="border-b border-white/10 pb-3 text-center">
              <div className="mx-auto mb-1.5 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#ff4a4f] to-[#9e0710] text-sm font-black text-white">
                J
              </div>
              <p className="text-sm font-semibold text-white">{shopName}</p>
              <p className="text-xs text-white/45">{phone}</p>
            </div>
            <div className="flex min-h-[15rem] flex-col justify-end gap-2 pt-4">
              <div className="ml-auto max-w-[88%] whitespace-pre-line rounded-2xl rounded-br-md bg-gradient-to-b from-[#ff3b3f] to-[#d40f17] px-4 py-3 text-[0.92rem] leading-snug text-white shadow-[0_8px_24px_-8px_rgba(255,59,63,0.7)]">
                {message}
              </div>
              <div className={`ml-auto flex h-5 items-center gap-1 pr-2 transition-opacity ${typing ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/60" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/60 [animation-delay:0.15s]" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/60 [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 grid max-w-[22rem] gap-3">
          <a href={smsHref} className="btn-ignite justify-center">
            Send as a text
          </a>
          <div className="grid grid-cols-2 gap-3">
            <a href={mailHref} className="btn-ghost-ign justify-center">
              Email it
            </a>
            <button type="button" onClick={copy} className="btn-ghost-ign justify-center">
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p className="text-center text-xs leading-relaxed text-white/45">
            Opens your own texting or email app with the message filled in. Nothing is sent from this website.
          </p>
        </div>
      </div>
    </div>
  );
}

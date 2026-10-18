"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tellJoeChat } from "@/components/site/joe/events";
import { OPEN_ASSISTANT_EVENT, type OpenAssistantDetail } from "./events";

type Msg = { role: "user" | "assistant"; content: string };
type Booking = { ref: string; when: string };
type Props = { shopName: string; phone: string; phoneHref: string };

const STORE = "joes-assistant-v1";
const STARTERS = ["Book an appointment", "What are your hours?", "My brakes are grinding", "Do you work on my car?"];

/** What to tell the visitor when /api/assistant fails. */
function failNotice(status: number, code: string | undefined, phone: string): string {
  if (code === "not_configured") return `Online chat isn't switched on yet. Call or text ${phone}.`;
  if (status === 429) return `That's a lot of messages — give it a minute, or call ${phone}.`;
  if (code === "busy") return `The assistant is swamped right now. Try again shortly, or call ${phone}.`;
  return `Something went wrong on our end. Try again, or call ${phone}.`;
}

/**
 * Floating chat + booking assistant for the public site. Talks to
 * /api/assistant; the conversation lives only in this tab (sessionStorage).
 * Open it from anywhere with openAssistant() from ./events.
 */
export function ShopAssistant({ shopName, phone, phoneHref }: Props) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [bookings, setBookings] = useState<Record<number, Booking>>({});
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null");
      if (saved?.msgs) setMsgs(saved.msgs);
      if (saved?.bookings) setBookings(saved.bookings);
    } catch {
      /* private mode or bad data — start fresh */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ msgs, bookings }));
    } catch {
      /* storage unavailable */
    }
  }, [msgs, bookings]);

  // Let Joe (the mascot) react to the chat.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) tellJoeChat(open ? "open" : "closed");
  }, [open]);
  useEffect(() => {
    if (mounted.current) tellJoeChat(pending ? "waiting" : "replied");
    mounted.current = true;
  }, [pending]);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, pending, open, notice]);

  useEffect(() => {
    if (!open || window.matchMedia("(min-width: 640px)").matches) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || pending) return;
      const before = msgs;
      const next: Msg[] = [...msgs, { role: "user", content }];
      setMsgs(next);
      setInput("");
      setPending(true);
      setNotice(null);
      const rollback = () => {
        setMsgs(before);
        setInput(content);
      };
      try {
        // Odd length keeps the window starting on a user turn.
        const recent = next.length > 29 ? next.slice(next.length - 29) : next;
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: recent }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || typeof data.reply !== "string") {
          rollback();
          setNotice(failNotice(res.status, data.error, phone));
          return;
        }
        setMsgs([...next, { role: "assistant", content: data.reply }]);
        if (data.booking?.ref) {
          setBookings((b) => ({ ...b, [next.length]: { ref: data.booking.ref, when: data.booking.when } }));
          tellJoeChat("booked");
        }
      } catch {
        rollback();
        setNotice(`Couldn't reach the assistant. Check your connection, or call ${phone}.`);
      } finally {
        setPending(false);
      }
    },
    [msgs, pending, phone],
  );

  // Let buttons elsewhere on the site open the panel (and optionally ask something).
  const sendRef = useRef(send);
  sendRef.current = send;
  const msgCount = useRef(0);
  msgCount.current = msgs.length;
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const prompt = (e as CustomEvent<OpenAssistantDetail>).detail?.prompt;
      if (prompt && msgCount.current === 0) void sendRef.current(prompt);
    };
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
  }, []);

  const reset = () => {
    setMsgs([]);
    setBookings({});
    setNotice(null);
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="joes-assistant"
        aria-label={open ? "Close assistant" : "Ask & book"}
        className={`assistant-launch fixed bottom-4 right-4 z-[60] items-center gap-2.5 rounded-full bg-gradient-to-b from-[#ff4a4f] to-[#b3060e] p-3 text-sm sm:bottom-5 sm:right-5 sm:py-3 sm:pl-3.5 sm:pr-5 font-bold text-white shadow-[0_12px_40px_-8px_rgba(227,18,27,0.75)] ring-1 ring-white/20 transition-transform hover:scale-[1.04] ${
          open ? "hidden sm:inline-flex" : "inline-flex"
        }`}
      >
        <span className="relative grid h-7 w-7 place-items-center rounded-full bg-black/25">
          {open ? <CloseIcon /> : <BoltChatIcon />}
          {!open && <span className="assistant-ping absolute inset-0 rounded-full ring-2 ring-white/60" aria-hidden="true" />}
        </span>
        <span className="hidden sm:inline">{open ? "Close" : "Ask & book"}</span>
      </button>

      {open && (
        <section
          id="joes-assistant"
          role="dialog"
          aria-label={`${shopName} assistant`}
          className="assistant-in fixed inset-0 z-[61] flex flex-col overflow-hidden bg-[#100e0d] text-white sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(40rem,calc(100vh-8rem))] sm:w-[25rem] sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-[0_30px_90px_-20px_rgba(227,18,27,0.55)]"
        >
          <header className="relative flex items-center gap-3 border-b border-white/10 bg-gradient-to-b from-[#1d1a18] to-[#100e0d] px-4 pb-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] sm:pt-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ff4a4f] to-[#9e0710] shadow-[0_0_18px_rgba(255,59,63,0.5)]">
              <BoltChatIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="mega truncate text-xl leading-none">{shopName}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/55">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" aria-hidden="true" />
                AI assistant · answers &amp; booking requests
              </p>
            </div>
            {msgs.length > 0 && (
              <button type="button" onClick={reset} className="rounded-lg px-2 py-1 text-xs font-semibold text-white/55 hover:bg-white/10 hover:text-white">
                New chat
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label="Close assistant"
              className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              <CloseIcon />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite">
            <Bubble role="assistant">
              Hey there! I&apos;m the shop&apos;s AI assistant. Ask me about services, hours, or a noise your vehicle is
              making — or I can request an appointment for you.
            </Bubble>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-white/80 transition-colors hover:border-[#ff3b3f] hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i}>
                <Bubble role={m.role}>{m.content}</Bubble>
                {bookings[i] && (
                  <div className="mt-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.07] p-4">
                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                      <CheckIcon /> Request sent
                    </p>
                    <p className="mt-1 text-white">{bookings[i].when}</p>
                    <p className="mt-1 text-xs text-white/55">
                      Ref {bookings[i].ref} · Joe will call or text to confirm.
                    </p>
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-white/[0.07] py-3" aria-label="Assistant is typing">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/70" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/70 [animation-delay:0.15s]" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/70 [animation-delay:0.3s]" />
              </div>
            )}
            {notice && (
              <p className="rounded-xl border border-[#ff3b3f]/40 bg-[#ff3b3f]/10 px-3 py-2 text-sm text-white/85">
                {notice}{" "}
                <a href={`tel:${phoneHref}`} className="font-semibold text-[#ff8a8c] underline underline-offset-2">
                  Call now
                </a>
              </p>
            )}
          </div>

          <form
            className="border-t border-white/10 bg-[#0c0b0a] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 focus-within:border-[#ff3b3f]/70">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                maxLength={1000}
                placeholder="Ask a question or book a time…"
                aria-label="Message the assistant"
                className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2.5 py-2 text-base sm:text-[0.95rem] text-white placeholder:text-white/35 focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                aria-label="Send"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[#ff4a4f] to-[#c20a12] text-white transition-opacity disabled:opacity-35"
              >
                <SendIcon />
              </button>
            </div>
            <p className="mt-2 px-1 text-center text-[11px] leading-snug text-white/40">
              AI can make mistakes. Bookings are requests until the shop confirms. Urgent?{" "}
              <a href={`tel:${phoneHref}`} className="text-white/65 underline underline-offset-2">
                {phone}
              </a>
            </p>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: Msg["role"]; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[0.95rem] leading-snug ${
          mine
            ? "rounded-br-md bg-gradient-to-b from-[#ff3b3f] to-[#d40f17] text-white"
            : "rounded-bl-md border border-white/10 bg-white/[0.06] text-white/90"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function BoltChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12.6 6.5-2.6 4h3.2l-2.6 4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

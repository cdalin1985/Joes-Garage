"use client";

import { openAssistant } from "./events";

/** A button anywhere on the site that opens the assistant, optionally with a first message. */
export function OpenAssistantButton({
  className,
  prompt,
  children,
}: {
  className?: string;
  prompt?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => openAssistant(prompt)}>
      {children}
    </button>
  );
}

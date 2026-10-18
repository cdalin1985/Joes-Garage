import type { SoundKind } from "@/components/site/fx/noise-synth";

/** Window event the noise decoder fires so Joe can act out the sound (null = stopped). */
export const JOE_NOISE_EVENT = "joes:noise";
export type JoeNoiseDetail = { sound: SoundKind | null };

export function tellJoe(sound: SoundKind | null) {
  window.dispatchEvent(new CustomEvent<JoeNoiseDetail>(JOE_NOISE_EVENT, { detail: { sound } }));
}

/** Window event the shop assistant fires so Joe can react to the chat. */
export const JOE_CHAT_EVENT = "joes:chat";
export type JoeChatState = "open" | "closed" | "waiting" | "replied" | "booked";
export type JoeChatDetail = { state: JoeChatState };

export function tellJoeChat(state: JoeChatState) {
  window.dispatchEvent(new CustomEvent<JoeChatDetail>(JOE_CHAT_EVENT, { detail: { state } }));
}

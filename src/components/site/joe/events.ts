import type { SoundKind } from "@/components/site/fx/noise-synth";

/**
 * Window event the noise decoder fires so Joe can act out the sound (null =
 * stopped). `armed` means a sound is about to play: fetch its pose, don't act.
 */
export const JOE_NOISE_EVENT = "joes:noise";
export type JoeNoiseDetail = { sound: SoundKind | null; armed?: boolean };

export function tellJoe(sound: SoundKind | null, armed = false) {
  window.dispatchEvent(new CustomEvent<JoeNoiseDetail>(JOE_NOISE_EVENT, { detail: { sound, armed } }));
}

/** Window event the shop assistant fires so Joe can react to the chat. */
export const JOE_CHAT_EVENT = "joes:chat";
export type JoeChatState = "open" | "closed" | "waiting" | "replied" | "booked";
export type JoeChatDetail = { state: JoeChatState };

export function tellJoeChat(state: JoeChatState) {
  window.dispatchEvent(new CustomEvent<JoeChatDetail>(JOE_CHAT_EVENT, { detail: { state } }));
}

/** Window event Hero Joe fires as he points at the spark plug, so it fires on cue. */
export const JOE_SPARK_EVENT = "joes:spark";

/** Window event the hero fires when the visitor clicks the spark plug. */
export const JOE_PLUG_EVENT = "joes:plug";

export function tellJoePlug() {
  window.dispatchEvent(new Event(JOE_PLUG_EVENT));
}

/** Window event the Hide Joe toggle fires, just before every Joe fades out (or back in). */
export const JOE_HIDDEN_EVENT = "joes:hidden";
export type JoeHiddenDetail = { hidden: boolean };

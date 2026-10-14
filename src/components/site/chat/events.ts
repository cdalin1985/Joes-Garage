/** Window event that opens the website assistant (optionally sending a first message). */
export const OPEN_ASSISTANT_EVENT = "joes:open-assistant";

export type OpenAssistantDetail = { prompt?: string };

export function openAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent<OpenAssistantDetail>(OPEN_ASSISTANT_EVENT, { detail: { prompt } }));
}

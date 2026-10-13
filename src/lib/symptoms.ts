/**
 * "What's that noise?" — common symptoms drivers describe, what usually
 * causes them, and which of the shop's services handles it.
 *
 * General guidance only (the site says so next to it): sounds vary by
 * vehicle, and the real answer comes from an inspection. `sound` picks the
 * synthesized example in noise-synth.ts; `serviceSlug` must exist in
 * site-config's services.
 */

export type Urgency = "now" | "soon" | "check";

/** Window event the decoder fires to add a symptom to the text-Joe builder. */
export const ADD_SYMPTOM_EVENT = "joes:add-symptom";

export type Symptom = {
  id: string;
  label: string;
  /** Short phrase used when composing a text to Joe. */
  phrase: string;
  causes: string[];
  urgency: Urgency;
  advice: string;
  serviceSlug: string;
  sound: "squeal" | "grind" | "hum" | "clicks" | "clunk" | "rapid-click" | "belt" | "hiss" | "none";
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  now: "Get it checked now",
  soon: "Book it soon",
  check: "Worth a look",
};

export const symptoms: Symptom[] = [
  {
    id: "squeal-braking",
    label: "Squeal when braking",
    phrase: "a high squeal when I brake",
    causes: [
      "Brake pads worn down to their built-in wear indicator (it squeals on purpose)",
      "Glazed pads or rotors",
      "Missing or worn anti-rattle hardware",
    ],
    urgency: "soon",
    advice: "Usually a warning, not an emergency — but don't let it turn into grinding.",
    serviceSlug: "brake-repair",
    sound: "squeal",
  },
  {
    id: "grind-braking",
    label: "Grinding when braking",
    phrase: "grinding when I brake",
    causes: [
      "Pads worn through to the metal backing plate",
      "Scored or damaged rotors",
      "A stone or debris caught in the brake",
    ],
    urgency: "now",
    advice: "Metal on metal chews up rotors fast and can cut your stopping power. Bring it in.",
    serviceSlug: "brake-repair",
    sound: "grind",
  },
  {
    id: "hum-speed",
    label: "Hum that grows with speed",
    phrase: "a hum or growl that gets louder as I speed up",
    causes: [
      "A worn wheel bearing — often changes when you lean into a turn",
      "Cupped or unevenly worn tires",
      "Aggressive tire tread",
    ],
    urgency: "soon",
    advice: "Joe's tip: older vehicles often have serviceable wheel bearings — have them checked at oil changes.",
    serviceSlug: "suspension-and-alignment",
    sound: "hum",
  },
  {
    id: "click-turning",
    label: "Clicking when turning",
    phrase: "clicking when I turn",
    causes: ["A worn outer CV joint on the front axle", "A torn CV boot that let grease out and dirt in"],
    urgency: "soon",
    advice: "Caught early, it's often just the axle. Left alone, a joint can fail.",
    serviceSlug: "diagnostics",
    sound: "clicks",
  },
  {
    id: "clunk-bumps",
    label: "Clunk over bumps",
    phrase: "a clunk over bumps",
    causes: ["Worn sway-bar links or bushings", "Worn ball joints or tie-rod ends", "Tired struts or strut mounts"],
    urgency: "soon",
    advice: "Steering and suspension parts wear slowly — a clunk is the early warning.",
    serviceSlug: "suspension-and-alignment",
    sound: "clunk",
  },
  {
    id: "no-start-click",
    label: "Clicks but won't start",
    phrase: "it clicks but won't start",
    causes: [
      "Rapid clicking: a weak or dead battery, or loose / corroded terminals",
      "One solid click: often the starter or its connection",
    ],
    urgency: "now",
    advice: "Stuck? Call — a battery test tells a lot in a few minutes.",
    serviceSlug: "batteries-and-electrical",
    sound: "rapid-click",
  },
  {
    id: "belt-squeal",
    label: "Squeal at startup or with A/C on",
    phrase: "a squeal when I start it or turn on the A/C",
    causes: ["A worn, glazed or loose serpentine belt", "A weak belt tensioner or a worn pulley"],
    urgency: "check",
    advice: "That belt runs the alternator and more — cheap to replace before it snaps.",
    serviceSlug: "scheduled-maintenance",
    sound: "belt",
  },
  {
    id: "steam-sweet",
    label: "Sweet smell or steam",
    phrase: "a sweet smell or steam from under the hood",
    causes: ["A coolant leak — radiator, hoses or water pump", "A heater core leak (sweet smell inside the cabin)"],
    urgency: "now",
    advice: "Watch the temperature gauge, and never open a hot radiator cap.",
    serviceSlug: "diagnostics",
    sound: "hiss",
  },
  {
    id: "check-engine",
    label: "Check engine light",
    phrase: "my check engine light is on",
    causes: [
      "Steady light: anything from a loose gas cap to a sensor fault — the stored code tells us where to look",
      "Flashing light: usually a serious misfire that can overheat the catalytic converter",
    ],
    urgency: "check",
    advice: "Flashing? Ease off and get it in right away. Steady? Get the code read soon.",
    serviceSlug: "diagnostics",
    sound: "none",
  },
];

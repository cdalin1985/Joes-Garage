/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  JOE'S GARAGE — WEBSITE SETTINGS
 *  This one file controls the public website and what Google is told about
 *  the business. Edit the values below; nothing else needs to change.
 *
 *  ⚠️  BEFORE THE SITE GOES LIVE, every line marked  «FILL IN»  must be
 *      replaced with the shop's REAL information. Google's local search
 *      ranking depends on the name, address, and phone here matching the
 *      Google Business Profile EXACTLY — same abbreviations, same spacing.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const site = {
  /**
   * Public web address of this site, no trailing slash. The shop has no
   * domain yet, so on Vercel this is the project's production address
   * (VERCEL_PROJECT_PRODUCTION_URL, e.g. something.vercel.app — set by Vercel,
   * no "https://"). Once a domain is bought, set NEXT_PUBLIC_SITE_URL to it.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),

  /** Business name — must match the Google Business Profile character for character. */
  /** As written on the shop's own Facebook page. */
  name: "Joe's Auto Garage",
  legalName: "Joe's Auto Garage", // «FILL IN» if the registered/LLC name differs
  tagline: "Honest auto repair, done right the first time",
  shortDescription:
    "ASE Master Certified auto repair in Helena, Montana — diagnostics, brakes, oil changes, A/C, engine and transmission work for every make and model.",

  phone: "(406) 577-6663",
  /** Same number, digits only, for tap-to-call links. */
  phoneHref: "+14065776663",
  /** From the shop's Facebook page contact info. */
  email: "joesautogarage406@gmail.com",

  /** Street address — write it exactly as it appears on the mailbox. */
  address: {
    street: "2810 N Cooke St", // as listed on the shop's Facebook page
    city: "Helena",
    state: "MT",
    zip: "59601", // confirmed by the owner; must match the Google listing exactly
    country: "US",
  },

  /**
   * Map coordinates. «FILL IN» — open Google Maps, right-click the shop,
   * click the numbers to copy them. Leave as null to omit from search data.
   */
  geo: { lat: null as number | null, lng: null as number | null },

  /**
   * Towns and neighborhoods served — these help you show up in nearby searches.
   * «REVIEW» — trim anything you don't actually draw customers from.
   */
  serviceArea: [
    "Helena",
    "East Helena",
    "Helena Valley",
    "Montana City",
    "Clancy",
    "Townsend",
  ],

  /**
   * Opening hours. Use 24-hour "HH:MM". Set `closed: true` for days you're shut.
   * These feed both the website and the "Open now" badge Google shows.
   */
  hours: [
    { day: "Monday", open: "08:00", close: "17:00", closed: false },
    { day: "Tuesday", open: "08:00", close: "17:00", closed: false },
    { day: "Wednesday", open: "08:00", close: "17:00", closed: false },
    { day: "Thursday", open: "08:00", close: "17:00", closed: false },
    { day: "Friday", open: "08:00", close: "17:00", closed: false },
    // 8 AM – 5 PM confirmed by the owner. Weekends are listed closed — set
    // closed:false and real times if the shop starts opening Saturdays.
    { day: "Saturday", open: "", close: "", closed: true },
    { day: "Sunday", open: "", close: "", closed: true },
  ],

  /** Payment methods accepted (shown on the site and in search data). */
  payments: ["Cash", "Visa", "Mastercard", "American Express", "Discover", "Check"],

  /**
   * Social & listing profiles. «FILL IN» the ones you have, delete the rest.
   * Linking these tells Google they're the same business — it strengthens the listing.
   */
  profiles: {
    google: "", // your Google Business Profile / Maps share link
    facebook: "https://www.facebook.com/p/Joes-Auto-Garage-61593974189103/",
    yelp: "",
    instagram: "",
  },

  /**
   * Trust points shown across the site.
   * ⚠️ «REVIEW» — only claim what is actually true. Delete any that don't apply.
   */
  trust: [
    { label: "ASE Master Certified", value: "Top-tier technician certification" },
    { label: "Free written estimates", value: "Approve before we touch it" },
    { label: "Photo inspections", value: "See what we see, on your phone" },
    { label: "All makes & models", value: "Domestic, import, and fleet" },
  ],

  /**
   * Certifications. "ASE Master Certified" is confirmed by the owner — a
   * genuine differentiator and a term people search for. Keep it current.
   */
  certifications: [
    "ASE Master Certified Specialist",
  ],

  /**
   * Year the shop opened. «FILL IN» — left null on purpose so the site never
   * claims a founding year we haven't confirmed. The About page adapts.
   */
  foundedYear: null as number | null,

  /** IANA time zone the hours above are in — drives the live OPEN/CLOSED sign. */
  timeZone: "America/Denver",

  /**
   * Joe's own maintenance tip, quoted word for word from the shop's Facebook
   * page. Swap in a new one whenever he posts another.
   */
  shopTip: {
    title: "Check those wheel bearings",
    quote:
      "Just a friendly reminder that some of your older vehicles still have serviceable wheel bearings. Don’t forget to have those checked every oil change!",
  },
} as const;

export type Service = {
  slug: string;
  name: string;
  /** Short line used on cards and in menus. */
  blurb: string;
  /** Page <title>/meta description support. */
  metaTitle: string;
  metaDescription: string;
  /** Opening paragraph on the service page. */
  intro: string;
  /** "You might need this if…" — how customers actually describe the problem. */
  symptoms: string[];
  /** What the job includes. */
  includes: string[];
};

/**
 * One page per service. Each becomes its own address on the web
 * (e.g. /services/brake-repair), which is how people searching
 * "brake repair near me" find the shop.
 */
export const services: Service[] = [
  {
    slug: "diagnostics",
    name: "Check Engine Light & Diagnostics",
    blurb: "We find the actual cause — not just the code.",
    metaTitle: "Check Engine Light Diagnostics",
    metaDescription:
      "Check engine light on? We run full computer diagnostics to find the real cause, explain it in plain English, and quote the fix before any work starts.",
    intro:
      "A trouble code tells us where to start looking — it doesn't tell us what's broken. We pull the codes, then actually test the system: live data, wiring, sensors, and the mechanical parts behind them. You get a plain-English explanation of what failed, what it costs, and what happens if you wait.",
    symptoms: [
      "Check engine light on, flashing, or coming and going",
      "Car runs rough, hesitates, or stalls",
      "Fuel mileage dropped for no clear reason",
      "Failed an emissions test",
      "Another shop replaced parts and the light came back",
    ],
    includes: [
      "Full computer scan of every module, not just the engine",
      "Live data and component testing to confirm the cause",
      "Written estimate before any repair begins",
      "Re-scan after the repair to verify the fix held",
    ],
  },
  {
    slug: "brake-repair",
    name: "Brake Repair & Replacement",
    blurb: "Pads, rotors, calipers, lines, and brake fluid service.",
    metaTitle: "Brake Repair & Brake Pad Replacement",
    metaDescription:
      "Squealing, grinding, or a soft pedal? Full brake inspection, pads, rotors, calipers, and fluid service with a written estimate before work starts.",
    intro:
      "Brakes are the one system where waiting costs more than fixing. We measure pad thickness and rotor runout, inspect the hydraulics and parking brake, and show you the numbers. If the pads have life left, we'll tell you that too.",
    symptoms: [
      "Squealing, grinding, or scraping when you stop",
      "Pedal feels soft, spongy, or sinks to the floor",
      "Steering wheel or pedal shudders when braking",
      "Car pulls to one side as you slow down",
      "Brake or ABS warning light is on",
    ],
    includes: [
      "Measured inspection of pads, rotors, calipers, and hoses",
      "Quality pads and rotors matched to how you actually drive",
      "Brake fluid test and flush when it's due",
      "Road test to confirm a firm pedal and straight stop",
    ],
  },
  {
    slug: "oil-change",
    name: "Oil Changes & Fluid Service",
    blurb: "The right oil, the right filter, and a real look underneath.",
    metaTitle: "Oil Change & Fluid Service",
    metaDescription:
      "Full-service oil change with the manufacturer-specified oil and filter, plus a courtesy inspection of belts, hoses, fluids, tires, and brakes.",
    intro:
      "An oil change is also the best chance anyone gets to look your car over. While it's on the lift we check the belts, hoses, fluids, tires, and brakes — and tell you what we found, with photos, before anything else gets done.",
    symptoms: [
      "It's been 5,000 miles or six months since the last change",
      "Oil life monitor or maintenance light is on",
      "Oil looks black or smells burnt on the dipstick",
      "You're about to take a long road trip",
    ],
    includes: [
      "Manufacturer-specified oil and a quality filter",
      "Fluid top-off and a check of every reservoir",
      "Tire pressure set and tread depth measured",
      "Photo inspection of anything that needs attention",
    ],
  },
  {
    slug: "ac-and-heating",
    name: "A/C & Heating Repair",
    blurb: "Cold air in July, warm air in January.",
    metaTitle: "Car A/C Repair & Heater Service",
    metaDescription:
      "Auto air conditioning and heater repair — leak detection, recharge, compressor and blower work, so your car is comfortable year round.",
    intro:
      "Air conditioning almost never fails on its own — it leaks. Adding refrigerant without finding the leak just puts your money into the atmosphere. We test system pressures, find the leak, fix it, then recharge to the exact factory weight.",
    symptoms: [
      "Air blows warm, or only cools while you're moving",
      "Weak airflow at every vent setting",
      "Heater stays cold or fogs the windshield",
      "Musty or sweet smell when the fan comes on",
      "Clicking or squealing when the A/C engages",
    ],
    includes: [
      "System pressure test and dye leak detection",
      "Compressor, condenser, evaporator, and blower service",
      "Cabin air filter check and replacement",
      "Recharge to the exact factory refrigerant weight",
    ],
  },
  {
    slug: "batteries-and-electrical",
    name: "Batteries, Starters & Electrical",
    blurb: "No-starts, dead batteries, and gremlins in the wiring.",
    metaTitle: "Car Battery, Starter & Alternator Repair",
    metaDescription:
      "Battery testing and replacement, starter and alternator repair, and electrical diagnostics for no-start, dim-light, and dead-battery problems.",
    intro:
      "A car that won't start is usually one of three things — battery, starter, or charging system — and guessing gets expensive fast. We test all three under load so the part we replace is the part that failed.",
    symptoms: [
      "Clicks but won't crank, or cranks slowly",
      "Battery keeps going dead overnight",
      "Headlights dim at idle or brighten when you rev",
      "Battery or charging warning light is on",
      "Electronics reset themselves or behave strangely",
    ],
    includes: [
      "Load test of battery, starter draw, and alternator output",
      "Parasitic draw testing for batteries that die overnight",
      "Terminal, cable, and ground cleaning or replacement",
      "Quality battery sized to the vehicle, properly registered",
    ],
  },
  {
    slug: "suspension-and-alignment",
    name: "Suspension, Steering & Alignment",
    blurb: "Rough ride, wandering steering, and tires wearing crooked.",
    metaTitle: "Suspension, Steering & Wheel Alignment",
    metaDescription:
      "Shocks, struts, ball joints, tie rods, and wheel alignment — for a car that rides smooth, steers straight, and stops chewing through tires.",
    intro:
      "Suspension wear happens slowly enough that you stop noticing it. The tires notice. We inspect the whole steering and suspension system, and align the car to factory spec so your new tires last as long as they should.",
    symptoms: [
      "Car pulls to one side or wanders on the highway",
      "Steering wheel is off-center when driving straight",
      "Tires wearing unevenly or feathered on the edges",
      "Clunks, creaks, or knocks over bumps",
      "Ride feels bouncy or floaty after dips",
    ],
    includes: [
      "Full inspection of shocks, struts, joints, and bushings",
      "Precision alignment with a printed before-and-after",
      "Tire wear analysis to catch the underlying cause",
      "Road test on the same roads you drive",
    ],
  },
  {
    slug: "tires",
    name: "Tires, Mounting & Balancing",
    blurb: "Rotation, balancing, patches, and new rubber.",
    metaTitle: "Tire Mounting, Balancing & Rotation",
    metaDescription:
      "Tire mounting, balancing, rotation, flat repair, and TPMS service — with honest advice on when your tires actually need replacing.",
    intro:
      "Tires are the only part of your car that touches the road, and the easiest place to get oversold. We measure tread depth and show you the number, patch what can safely be patched, and only recommend replacement when the measurement says so.",
    symptoms: [
      "Vibration in the steering wheel or seat at speed",
      "Tread looks low, cracked, or worn on one edge",
      "Tire pressure light keeps coming on",
      "Picked up a nail or have a slow leak",
    ],
    includes: [
      "Mounting and road-force balancing",
      "Rotation and pressure set to the door-jamb spec",
      "Safe flat repair with an internal patch-plug",
      "TPMS sensor service and relearn",
    ],
  },
  {
    slug: "engine-and-transmission",
    name: "Engine & Transmission Repair",
    blurb: "Leaks, noises, overheating, and hard shifting.",
    metaTitle: "Engine & Transmission Repair",
    metaDescription:
      "Engine and transmission repair — leaks, overheating, timing components, hard shifting, and slipping — with a clear estimate before we start.",
    intro:
      "Big repairs deserve a straight answer about whether they're worth doing. We diagnose the failure, price the fix, and tell you honestly how it compares to the value of the car. Then it's your call — no pressure either way.",
    symptoms: [
      "Overheating, or coolant disappearing",
      "Knocking, ticking, or rattling from the engine",
      "Puddles or drips under where you park",
      "Transmission slips, jerks, or shifts hard",
      "Smoke from the exhaust or a burning smell",
    ],
    includes: [
      "Pressure, leak-down, and scan-tool diagnosis",
      "Timing belts and chains, gaskets, seals, and cooling repairs",
      "Transmission service, repair, or replacement options",
      "An honest repair-versus-replace conversation",
    ],
  },
  {
    slug: "scheduled-maintenance",
    name: "Scheduled & Factory Maintenance",
    blurb: "Keep the warranty, skip the dealership prices.",
    metaTitle: "Factory Scheduled Maintenance",
    metaDescription:
      "30/60/90k factory scheduled maintenance performed to manufacturer specification — keeps your warranty intact without dealership pricing.",
    intro:
      "You do not have to go to the dealer to keep a factory warranty. We perform the same manufacturer-specified services at the same intervals, document everything, and skip the items that pad the bill without helping the car.",
    symptoms: [
      "Approaching 30,000, 60,000, or 90,000 miles",
      "Maintenance reminder on the dash",
      "New-to-you car with unknown service history",
      "Dealer quoted a service package that felt padded",
    ],
    includes: [
      "The manufacturer's actual schedule for your VIN",
      "Fluids, filters, belts, and inspection items",
      "Documented records that protect your warranty",
      "A heads-up on what's coming at the next interval",
    ],
  },
  {
    slug: "pre-purchase-inspection",
    name: "Pre-Purchase Inspections",
    blurb: "Know what you're buying before you buy it.",
    metaTitle: "Pre-Purchase Used Car Inspection",
    metaDescription:
      "Independent pre-purchase inspection of any used car — mechanical, structural, and computer scan, with photos and a written report before you buy.",
    intro:
      "An hour on our lift is the cheapest insurance in car buying. We inspect the vehicle top to bottom, scan every module for stored faults, photograph what we find, and hand you a written report — so you either buy with confidence or walk away glad you asked.",
    symptoms: [
      "About to buy a used car, truck, or van",
      "Private-party sale with no dealer warranty",
      "Vehicle looks clean but the history is thin",
      "You want leverage to negotiate the price",
    ],
    includes: [
      "Lift inspection of frame, suspension, brakes, and leaks",
      "Full computer scan for stored and pending faults",
      "Photo report you can keep and share",
      "A straight recommendation: buy, negotiate, or pass",
    ],
  },
  {
    slug: "fleet-service",
    name: "Fleet & Commercial Service",
    blurb: "Keep the work trucks working.",
    metaTitle: "Fleet & Commercial Vehicle Service",
    metaDescription:
      "Fleet maintenance and repair for local contractors and small businesses — priority scheduling, consolidated invoicing, and per-vehicle service records.",
    intro:
      "When a truck is down, the crew is down. We keep per-vehicle service records for every unit in your fleet, schedule preventive work around your jobs, and bill it in a way your bookkeeper will actually thank you for.",
    symptoms: [
      "You run two or more work vehicles",
      "Downtime is costing you billable days",
      "You need maintenance records for every unit",
      "You want one invoice instead of a stack of receipts",
    ],
    includes: [
      "Priority scheduling and quick turnaround",
      "Preventive maintenance planned per vehicle",
      "Complete service history for every unit number",
      "Consolidated monthly invoicing on account",
    ],
  },
];

/** Questions real customers ask — these can also appear directly in Google results. */
export const faqs = [
  {
    q: "Do I need an appointment?",
    a: "Appointments get you in and out fastest, and we recommend calling ahead. That said, we keep room in the schedule for breakdowns and no-starts — if you're stuck, call us and we'll do our best to fit you in the same day.",
  },
  {
    q: "Will you tell me what it costs before you do the work?",
    a: "Always. You get a written estimate before anything is touched, and if we find something else once we're in there, we stop and call you. Nothing gets repaired without your approval.",
  },
  {
    q: "Do you work on my make and model?",
    a: "We service nearly every domestic and import car, truck, SUV, and van on the road, plus work vehicles and small fleets. If a job genuinely needs a dealer-only tool, we'll tell you straight rather than waste your time.",
  },
  {
    q: "Can I keep my factory warranty if you do the maintenance?",
    a: "Yes. Federal law says a dealership can't void your warranty just because an independent shop did the scheduled maintenance. We perform the manufacturer's specified services and document everything, which is exactly what protects you.",
  },
  {
    q: "How do I know the repair was actually necessary?",
    a: "We take photos. Our digital inspection shows you the worn brake pad or the leaking hose on your own phone, with a green / yellow / red rating, so you can see what we saw and decide for yourself.",
  },
  {
    q: "What if the same problem comes back?",
    a: "Bring it back. Our repairs are warrantied, and if something we fixed isn't right, making it right takes priority on the schedule.",
  },
];

/* ── Helpers used by the pages and by the data Google reads ─────────────── */

export const fullAddress = [
  site.address.street,
  `${site.address.city}, ${site.address.state}${site.address.zip ? ` ${site.address.zip}` : ""}`,
]
  .filter(Boolean)
  .join(", ");

export const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  `${site.name}, ${fullAddress}`,
)}`;

/** "8:00 AM" from "08:00" */
export function prettyTime(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Groups consecutive days with identical hours: "Mon – Fri 8:00 AM – 5:00 PM". */
export function groupedHours(): { days: string; hours: string }[] {
  const out: { days: string; hours: string }[] = [];
  for (const d of site.hours) {
    const label = d.closed ? "Closed" : `${prettyTime(d.open)} – ${prettyTime(d.close)}`;
    const prev = out[out.length - 1];
    if (prev && prev.hours === label) prev.days = `${prev.days.split(" – ")[0]} – ${d.day.slice(0, 3)}`;
    else out.push({ days: d.day.slice(0, 3), hours: label });
  }
  return out;
}

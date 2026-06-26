import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Warm granite neutrals ──────────────────────────────────────────
        // Overrides Tailwind's cool "slate" everywhere with a warm taupe-grey
        // so the whole UI inherits the Boulder/stone feel automatically.
        slate: {
          50: "#faf8f5",
          100: "#f2eee8",
          200: "#e5ded4",
          300: "#d2c8ba",
          400: "#aca091",
          500: "#847a6a",
          600: "#635b4d",
          700: "#4a4339",
          800: "#332e27",
          900: "#211d18",
          950: "#14110e",
        },
        // Granite alias (same scale) for explicit use
        granite: {
          50: "#faf8f5",
          100: "#f2eee8",
          200: "#e5ded4",
          300: "#d2c8ba",
          400: "#aca091",
          500: "#847a6a",
          600: "#635b4d",
          700: "#4a4339",
          800: "#332e27",
          900: "#211d18",
          950: "#14110e",
        },
        // ── Rust (primary actions, links, active nav) ──────────────────────
        brand: {
          50: "#fbf3f0",
          100: "#f7e3db",
          200: "#efc6b7",
          300: "#e3a088",
          400: "#d4744f",
          500: "#c4552f",
          600: "#a8421e",
          700: "#8a3719",
          800: "#702f19",
          900: "#5c2917",
          950: "#32130b",
        },
        // ── Ochre / brass (secondary accent, logo, key CTAs) ───────────────
        accent: {
          50: "#fcf6ec",
          100: "#f7e9ce",
          200: "#efd59c",
          300: "#e6bc64",
          400: "#dda63b",
          500: "#ce8f22",
          600: "#b0741b",
          700: "#8c5a18",
          800: "#734a1a",
          900: "#613e19",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(33, 29, 24, 0.04), 0 4px 12px -4px rgba(33, 29, 24, 0.08)",
        lift: "0 12px 32px -10px rgba(33, 29, 24, 0.22), 0 4px 10px -6px rgba(33, 29, 24, 0.12)",
        glow: "0 0 0 1px rgba(196, 85, 47, 0.12), 0 8px 28px -8px rgba(196, 85, 47, 0.30)",
        inset: "inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
      },
      backgroundImage: {
        "mesh-warm":
          "radial-gradient(at 0% 0%, rgba(221, 166, 59, 0.10) 0px, transparent 50%), radial-gradient(at 98% 2%, rgba(196, 85, 47, 0.08) 0px, transparent 45%), radial-gradient(at 50% 100%, rgba(132, 122, 106, 0.06) 0px, transparent 55%)",
        "brand-sheen":
          "linear-gradient(135deg, #a8421e 0%, #c4552f 45%, #ce8f22 130%)",
        "dark-sheen":
          "linear-gradient(180deg, #211d18 0%, #14110e 100%)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-6px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        rise: "rise 0.4s cubic-bezier(0.16, 0.84, 0.44, 1) both",
        fade: "fade 0.3s ease both",
        "slide-in": "slide-in 0.25s ease both",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

/**
 * DESIGN TOKENS
 * ─────────────
 * Every colour is a CSS variable defined in globals.css and swapped wholesale
 * by [data-theme]. Nothing in a component ever hardcodes a hex, so the two
 * themes can be tuned independently instead of one being an inversion of the
 * other.
 *
 * Values are space-separated RGB triplets so Tailwind's <alpha-value> slot
 * still works: `bg-accent/20`, `text-ink/60`, etc.
 */
const config: Config = {
  darkMode: ["class", '[data-theme="ink"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "rgb(var(--page) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--ink-2) / <alpha-value>)",
        faint: "rgb(var(--ink-3) / <alpha-value>)",
        /** Vivid ember — fills, graphics, large type. Not for small text on paper. */
        accent: "rgb(var(--accent) / <alpha-value>)",
        /** Contrast-safe ember — the only accent allowed under 24px. */
        "accent-ink": "rgb(var(--accent-ink) / <alpha-value>)",
        /** Text/icon colour for anything sitting *on* an ember fill. */
        "on-accent": "rgb(var(--on-accent) / <alpha-value>)",
        signal: "rgb(var(--signal) / <alpha-value>)",
        line: "var(--line)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Bricolage Grotesque", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Bricolage at 800 is much wider than a condensed face, so every step
        // comes down and the leading goes up — sentence case has descenders to
        // clear, which all-caps did not.
        d1: ["clamp(2.6rem, 6.6vw, 8rem)", { lineHeight: "0.94", letterSpacing: "-0.035em" }],
        d2: ["clamp(2rem, 4.4vw, 4.25rem)", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        d3: ["clamp(1.5rem, 2.6vw, 2.4rem)", { lineHeight: "1.08", letterSpacing: "-0.022em" }],
        d4: ["clamp(1.15rem, 1.7vw, 1.6rem)", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        lead: ["clamp(1.05rem, 1.15vw, 1.3rem)", { lineHeight: "1.62", letterSpacing: "-0.004em" }],
        micro: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.16em" }],
        micro2: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
      },
      borderRadius: {
        // One radius scale, applied by container size. Every bordered box on
        // the site uses one of these three so nothing is rounded by eye.
        tile: "0.875rem", // spec strips, small groups
        card: "1.25rem", // stack panels, directory blocks
        panel: "1.75rem", // full-width consoles, project plates, the portrait
      },
      spacing: {
        gut: "var(--gut)", // page gutter, fluid
      },
      maxWidth: {
        shell: "104rem",
      },
      transitionTimingFunction: {
        // One easing family, used everywhere. Expo-out for entrances, a soft
        // in-out for state changes. No springs, no bounce.
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        io: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: { 400: "400ms", 600: "600ms", 900: "900ms" },
      screens: { xs: "480px" },
    },
  },
  plugins: [],
};

export default config;

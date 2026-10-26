import type { Config } from "tailwindcss";

/**
 * VESPER design tokens. Colours, type and motion here are the single source of
 * truth; components never hard-code hex values or durations.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0C", // page ground
        night: "#121113", // raised surfaces
        graphite: "#2B2B2E", // panels, hairlines on hover
        line: "#2E2C2A", // hairlines
        ivory: "#EFEAE0", // primary text, primary button
        mist: "#B9B5AE", // secondary text (8.9:1 on ink)
        smoke: "#8C8A86", // tertiary text, labels (5.6:1 on ink)
        bronze: "#C9B8A6", // italic accent words
        oxblood: "#5E1A1D", // rare accent, alerts
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.22em",
        wordmark: "0.42em",
      },
      transitionTimingFunction: {
        glide: "cubic-bezier(0.22, 1, 0.36, 1)",
        camera: "cubic-bezier(0.65, 0, 0.35, 1)",
        quiet: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        instant: "150ms",
        quick: "300ms",
        standard: "600ms",
        cinematic: "1500ms",
      },
      maxWidth: {
        page: "1600px",
      },
    },
  },
  plugins: [],
};

export default config;

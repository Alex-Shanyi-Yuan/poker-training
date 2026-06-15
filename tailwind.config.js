/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        felt: {
          900: "#0a1f17",
          800: "#0e2a1f",
          700: "#143a2b",
        },
        ink: "#0b0f0d",
        accent: {
          DEFAULT: "#34d399",
          glow: "#6ee7b7",
        },
        gold: "#f5d77a",
      },
      boxShadow: {
        glow: "0 0 0 2px rgba(110,231,183,0.6), 0 0 24px rgba(52,211,153,0.45)",
        card: "0 6px 18px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        slate: {
          950: "#090d16",
          900: "#0f172a",
          850: "#131c2e",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
          200: "#e2e8f0",
          100: "#f1f5f9",
          50: "#f8fafc",
        },
        emerald: {
          DEFAULT: "#10b981",
          glow: "#10b981aa",
        },
        sky: {
          DEFAULT: "#0ea5e9",
          glow: "#0ea5e9aa",
        },
        red: {
          DEFAULT: "#ef4444",
          glow: "#ef4444aa",
        },
        amber: {
          DEFAULT: "#f59e0b",
          glow: "#f59e0baa",
        },
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
      backgroundImage: {
        "slate-gradient":
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      },
      boxShadow: {
        "glow-emerald": "0 0 20px rgba(16,185,129,0.3)",
        "glow-sky": "0 0 20px rgba(14,165,233,0.3)",
        "glow-red": "0 0 20px rgba(239,68,68,0.3)",
        "glow-amber": "0 0 20px rgba(245,158,11,0.3)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0.4)" },
          "50%": { boxShadow: "0 0 0 10px rgba(16,185,129,0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

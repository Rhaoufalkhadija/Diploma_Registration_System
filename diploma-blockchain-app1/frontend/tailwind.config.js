/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        navy: {
          950: "#040d1a",
          900: "#071428",
          800: "#0d2044",
          700: "#122a58",
          600: "#1a3a7a",
        },
        gold: {
          400: "#f5c842",
          500: "#e6b800",
          600: "#c9a000",
        },
        slate: {
          850: "#162032",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(245,200,66,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease forwards",
        "fade-in":    "fadeIn 0.4s ease forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        shimmer:      "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        card:   "0 4px 32px rgba(0,0,0,0.45)",
        glow:   "0 0 24px rgba(245,200,66,0.18)",
        "glow-lg": "0 0 48px rgba(245,200,66,0.25)",
      },
    },
  },
  plugins: [],
};
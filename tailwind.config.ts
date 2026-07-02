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
        // Ana kimlik: koyu kömür/lacivert navbar + altın vurgu
        ink: {
          DEFAULT: "#111827",
          light: "#1f2937",
        },
        gold: {
          DEFAULT: "#D4A017",
          light: "#F4C542",
        },
        // Yeşil ikincil vurgu olarak korunur
        primary: {
          DEFAULT: "#065f46",
          dark: "#064e3b",
          light: "#f0fdf4",
        },
        accent: {
          DEFAULT: "#fcd34d",
        },
        surface: {
          DEFAULT: "#f8fafc",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "Tahoma", "Geneva", "Verdana", "sans-serif"],
        arabic: ["Amiri", "Traditional Arabic", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

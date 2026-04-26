import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: "rgba(30, 41, 59, 0.7)",
        primary: "#14B8A6",
        "primary-hover": "#0D9488",
        accent: "#F59E0B",
        success: "#10B981",
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
        "border-color": "rgba(148, 163, 184, 0.2)",
      },
      fontFamily: {
        sans: ["\"Plus Jakarta Sans\"", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0,0,0,0.1)",
        primary: "0 0 10px rgba(20,184,166,0.5)",
      },
    },
  },
  plugins: [],
} satisfies Config;

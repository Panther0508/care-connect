import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: "rgba(30, 41, 59, 0.65)",
        "surface-hover": "rgba(51, 65, 85, 0.75)",
        primary: "#14B8A6",
        "primary-hover": "#0D9488",
        "primary-glow": "rgba(20, 184, 166, 0.3)",
        accent: "#F59E0B",
        "accent-glow": "rgba(245, 158, 11, 0.3)",
        success: "#10B981",
        "success-glow": "rgba(16, 185, 129, 0.3)",
        error: "#EF4444",
        "error-glow": "rgba(239, 68, 68, 0.3)",
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
        "text-muted": "#64748B",
        border: "rgba(148, 163, 184, 0.15)",
        "border-strong": "rgba(148, 163, 184, 0.3)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glass-hover": "0 12px 40px rgba(0, 0, 0, 0.4)",
        primary: "0 0 20px rgba(20,184,166,0.4)",
        accent: "0 0 20px rgba(245,158,11,0.4)",
        success: "0 0 20px rgba(16,185,129,0.4)",
        error: "0 0 20px rgba(239,68,68,0.4)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px currentColor" },
          "50%": { boxShadow: "0 0 20px currentColor" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

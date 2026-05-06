import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./src/**/**/*.{js,ts,jsx,tsx}"],
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
        danger: "#EF4444",
        "error-glow": "rgba(239, 68, 68, 0.3)",
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
        "text-muted": "#64748B",
        "text-disabled": "#475569",
        border: "rgba(148, 163, 184, 0.12)",
        "border-strong": "rgba(148, 163, 184, 0.3)",
        "border-hover": "rgba(148, 163, 184, 0.12)",
        "border-active": "rgba(20, 184, 166, 0.25)",
        "border-focus": "rgba(20, 184, 166, 0.3)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
        "2xl": "64px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glass-hover": "0 12px 40px rgba(0, 0, 0, 0.4)",
        primary: "0 0 20px rgba(20,184,166,0.4)",
        accent: "0 0 20px rgba(245,158,11,0.4)",
        success: "0 0 20px rgba(16,185,129,0.4)",
        error: "0 0 20px rgba(239,68,68,0.4)",
        "ambient-loose": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        "ambient-tight": "0 8px 20px -4px rgba(0, 0, 0, 0.3)",
        "ambient-none": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
        "ripple": "ripple 0.6s ease-out",
        "bounce": "bounce 2s infinite",
        "spin-slow": "spin 3s linear infinite",
        "ping-sm": "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
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
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        ripple: {
          "0%": { transform: "scale(0.8); opacity: 0" },
          "50%": { transform: "scale(1.2); opacity: 0.2" },
          "100%": { transform: "scale(1); opacity: 0" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "ping-sm": {
          "75%, 100%": {
            transform: "scale(2)",
            opacity: "0",
          },
        },
      },
      spacing: {
        "128": "32rem",
        "144": "36rem",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
        "110": "110",
        "120": "120",
        "130": "130",
        "140": "140",
        "150": "150",
      },
       fontSize: {
        "xs": ["0.8125rem", { lineHeight: "1.125rem" }],  // 13px
        "sm": ["0.9375rem", { lineHeight: "1.25rem" }],  // 15px
        "base": ["1.0625rem", { lineHeight: "1.625rem" }],  // 17px
        "lg": ["1.1875rem", { lineHeight: "1.75rem" }],  // 19px
        "xl": ["1.3125rem", { lineHeight: "1.875rem" }],  // 21px
        "2xl": ["1.5rem", { lineHeight: "2.25rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.5rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.75rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      fontWeight: {
        hairline: "100",
        thin: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },
      letterSpacing: {
        tighter: "-0.05em",
        tight: "-0.02em",
        normal: "0",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.1em",
      },
      lineHeight: {
        tight: "1.2",
        snug: "1.3",
        normal: "1.5",
        relaxed: "1.6",
        loose: "2",
      },
      transitionDuration: {
        "75": "75ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
        "500": "500ms",
        "700": "700ms",
        "1000": "1000ms",
      },
      transitionTimingFunction: {
        "in": "cubic-bezier(0.4, 0, 1, 1)",
        "out": "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        "spring": "cubic-bezier(0.4, 0.05, 0.55, 0.95)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
   plugins: [
     require('tailwindcss-fluid-type')({
       settings: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'],
     }),
   ],
} satisfies Config;

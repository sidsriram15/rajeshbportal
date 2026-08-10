import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem" },
    extend: {
      colors: {
        canvas: "hsl(var(--canvas))",
        surface: "hsl(var(--surface))",
        raised: "hsl(var(--raised))",
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        faint: "hsl(var(--faint))",
        line: "hsl(var(--line))",
        "line-strong": "hsl(var(--line-strong))",
        accent: "hsl(var(--accent))",
        "accent-soft": "hsl(var(--accent-soft))",
        topic: "hsl(var(--topic))",
        question: "hsl(var(--question))",
        answer: "hsl(var(--answer))",
        resource: "hsl(var(--resource))",
        live: "hsl(var(--live))",
        danger: "hsl(var(--danger))",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "10px",
      },
      boxShadow: {
        hair: "0 1px 0 0 hsl(var(--line))",
        card: "0 1px 2px 0 hsl(var(--shadow) / 0.05), 0 1px 1px -1px hsl(var(--shadow) / 0.04)",
        pop: "0 10px 30px -12px hsl(var(--shadow) / 0.28), 0 2px 8px -4px hsl(var(--shadow) / 0.16)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--live) / 0.5)" },
          "70%": { boxShadow: "0 0 0 6px hsl(var(--live) / 0)" },
          "100%": { boxShadow: "0 0 0 0 hsl(var(--live) / 0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        bar: {
          "0%, 100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
        "flash-in": {
          "0%": { backgroundColor: "hsl(var(--accent-soft))" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        "fade-up": "fade-up 240ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in": "slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        shimmer: "shimmer 1.6s infinite",
        bar: "bar 900ms ease-in-out infinite",
        "flash-in": "flash-in 1.4s ease-out both",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

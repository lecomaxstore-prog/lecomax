/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        paper: "#ffffff",
        muted: "#767677",
        line: "#e5e5e5",
        accent: "#0071ae",
        brand: {
          50: "#eefdf5",
          100: "#d6f9e7",
          200: "#aff1d1",
          300: "#79e3b5",
          400: "#3fcd93",
          500: "#16b277",
          600: "#0a9061",
          700: "#0a7350",
          800: "#0c5b41",
          900: "#0b4b37",
          950: "#042a20",
        },
        success: "#16b277",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#0071ae",
      },
      fontFamily: {
        sans: ["var(--font-sans, Inter)", "Helvetica Neue", "Arial", "sans-serif"],
        display: [
          "var(--font-display, Sora)",
          "var(--font-sans, Inter)",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      letterSpacing: {
        brand: "0.02em",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
        card: "0 4px 24px rgba(0,0,0,0.07)",
        "card-hover": "0 12px 40px rgba(0,0,0,0.12)",
        focus: "0 0 0 3px rgba(22,178,119,0.35)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

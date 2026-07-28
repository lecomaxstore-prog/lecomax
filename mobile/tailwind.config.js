/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0B",
        lime: "#3ECF4C",
        green: "#3ECF4C",
        "green-dark": "#168526",
        canvas: "#F7F7F8",
        muted: "#777C74",
      },
      borderRadius: { card: "28px" },
    },
  },
  plugins: [],
};

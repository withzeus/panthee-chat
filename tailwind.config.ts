import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f1115",
        surface: "#171a21",
        bubble: "#20242e",
        accent: "#6366f1",
        border: "#2a2e38",
      },
    },
  },
  plugins: [],
} satisfies Config;

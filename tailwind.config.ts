import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./stores/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#4F46E5"
        }
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211d",
        paper: "#f7f5ef",
        trail: "#3f7f64",
        clay: "#b65f41",
        sun: "#e5ad42"
      }
    }
  },
  plugins: []
};

export default config;

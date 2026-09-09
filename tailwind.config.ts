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
        primary: {
          DEFAULT: "#2e8b57",
          hover: "#256d46",
          dark: "#198754",
        },
        secondary: {
          DEFAULT: "#f5f8fb",
        },
        success: {
          bg: "#d1e7dd",
          text: "#0f5132",
          border: "#198754",
        },
        error: {
          bg: "#f8d7da",
          text: "#842029",
          border: "#dc3545",
        },
        warning: {
          bg: "#fff3cd",
          text: "#664d03",
          border: "#ffc107",
        },
        info: {
          bg: "#cff4fc",
          text: "#055160",
          border: "#0dcaf0",
        },
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "15px",
        xl: "20px",
        "2xl": "30px",
        full: "50px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0, 0, 0, 0.08)",
        card: "0 8px 20px rgba(0, 0, 0, 0.08)",
        md: "0 4px 12px rgba(0, 0, 0, 0.1)",
        hover: "0 12px 28px rgba(0, 0, 0, 0.12)",
        lg: "0 10px 25px rgba(0, 0, 0, 0.08)",
        xl: "0 16px 40px rgba(0, 0, 0, 0.15)",
        header: "0 2px 10px rgba(0, 0, 0, 0.08)",
      },
      fontSize: {
        "hero": "62px",
        "section": "42px",
        "sub": "30px",
        "card-title": "26px",
        "component": "22px",
        "small-heading": "20px",
      },
    },
  },
  plugins: [],
};
export default config;

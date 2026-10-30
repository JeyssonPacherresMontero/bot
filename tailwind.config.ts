import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        admin: {
          blue: "#007bff",
          indigo: "#6610f2",
          purple: "#6f42c1",
          pink: "#e83e8c",
          red: "#dc3545",
          orange: "#fd7e14",
          yellow: "#ffc107",
          green: "#28a745",
          teal: "#20c997",
          cyan: "#17a2b8",
          dark: "#343a40",
          darker: "#212529",
          gray: "#6c757d",
          light: "#f4f6f9",
          border: "#dee2e6",
        },
        primary: {
          50: "#e6f2ff",
          100: "#cce5ff",
          200: "#99caff",
          300: "#66b0ff",
          400: "#3395ff",
          500: "#007bff", // AdminLTE primary blue
          600: "#0069d9",
          700: "#0056b3",
          800: "#004085",
          900: "#002752",
        },
        plant: {
          50: "#e8f5e9",
          100: "#c8e6c9",
          500: "#28a745", // AdminLTE success green
          600: "#218838",
          700: "#1e7e34",
          800: "#19692c",
          900: "#145523",
        },
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        lte: "0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)",
        "lte-md": "0 0 1px rgba(0,0,0,.125), 0 2px 6px rgba(0,0,0,.25)",
        "lte-lg": "0 0 1px rgba(0,0,0,.125), 0 4px 12px rgba(0,0,0,.3)",
      },
      borderRadius: {
        lte: "0.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;

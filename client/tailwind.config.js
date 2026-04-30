/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 12px 30px rgba(24, 24, 27, 0.08)"
      }
    }
  },
  plugins: []
};

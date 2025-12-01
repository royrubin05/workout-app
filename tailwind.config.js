/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Dark slate
        surface: "rgba(30, 41, 59, 0.7)", // Glassy slate
        primary: "#3b82f6", // Blue
        accent: "#8b5cf6", // Purple
        success: "#10b981", // Emerald
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: '#F55F16',
        bgBody: '#F8F9FA',
        surface: '#FFFFFF',
        textMain: '#1A202C',
        textMuted: '#718096',
        borderColor: '#E2E8F0'
      }
    },
  },
  plugins: [],
}
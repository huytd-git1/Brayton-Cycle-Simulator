/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        engine: {
          blue: '#2563eb',
          cyan: '#06b6d4',
          orange: '#f97316',
          red: '#dc2626',
          yellow: '#eab308'
        }
      }
    },
  },
  plugins: [],
}

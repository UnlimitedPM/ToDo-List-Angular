/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'selector', // <--- AJOUTE CECI
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
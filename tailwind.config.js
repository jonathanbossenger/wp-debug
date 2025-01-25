/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./renderer/src/**/*.{js,jsx,ts,tsx}",
    "./renderer/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 

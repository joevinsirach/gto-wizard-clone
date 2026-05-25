/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui-components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          green: '#2d5a27',
          felt: '#1a472a',
          gold: '#d4af37',
          red: '#c41e3a',
        },
      },
    },
  },
  plugins: [],
}
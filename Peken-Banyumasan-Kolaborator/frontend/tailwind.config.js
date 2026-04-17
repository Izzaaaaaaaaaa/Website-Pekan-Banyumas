/** @type {import('tailwindcss').Config} */
// FINAL color system — charcoal sidebar, green action, amber accent, earth text
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        // PRIMARY action green — exact match with gate #2f6f4e
        primary: {
          50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0',
          300:'#86efac', 400:'#4ade80', 500:'#22c55e',
          600:'#16a34a', 700:'#2f6f4e',
          800:'#166534', 900:'#14532d', 950:'#052e16',
        },
        // SIDEBAR — near-black charcoal (professional dark, NOT green)
        batik: {
          50:'#f7f8f7', 100:'#edefed', 200:'#d1d5d1',
          300:'#a8ada8', 400:'#787c78', 500:'#565a56',
          600:'#3a3d3a', 700:'#282b28', 800:'#1d1f1d',
          900:'#141514', 950:'#0d0f0d',
        },
        // AMBER GOLD — cultural accent (logo, highlights, NOT buttons)
        brand: {
          50:'#fdf8f2', 100:'#f8edda', 200:'#f0d9af',
          300:'#e5be7a', 400:'#d9a24a', 500:'#c48930',
          600:'#a97025', 700:'#8a551c',
        },
        // WARM EARTH — text, backgrounds, borders
        earth: {
          50:'#faf7f4', 100:'#f3ede5', 200:'#e5d8c9',
          300:'#d1bc9d', 400:'#b99570', 500:'#a67d52',
          600:'#8f6742', 700:'#765337', 800:'#614531',
          900:'#523b2c',
        },
      },
    },
  },
  plugins: [],
}

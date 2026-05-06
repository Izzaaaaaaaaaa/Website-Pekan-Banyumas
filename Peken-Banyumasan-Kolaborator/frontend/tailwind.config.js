/** @type {import('tailwindcss').Config} */
// Peken Banyumasan Design System v2.0
// Primary accent: sage (#C3CA96). Sidebar: charcoal (#1B1B1B).
// Dashboard bg: pale sage (#f2f4e8). Cards: white w/ sage borders (#e4e7d4).
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Montserrat"', 'system-ui', 'sans-serif'],
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        italic:  ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        // PRIMARY — dark sage for interactive elements (buttons, links, active states)
        primary: {
          50:  '#f2f4e8',
          100: '#eef0e0',
          200: '#dde3c0',
          300: '#c8d09a',
          400: '#a8b07a',
          500: '#C3CA96',
          600: '#7A8A52',
          700: '#4F5C30',
          800: '#3a4520',
          900: '#1e2010',
          950: '#131508',
        },
        // BRAND — unified sage (was amber, now sage)
        brand: {
          50:  '#f2f4e8',
          100: '#eef0e0',
          200: '#dde3c0',
          300: '#c8d09a',
          400: '#a8b07a',
          500: '#C3CA96',
          600: '#7A8A52',
          700: '#4F5C30',
          800: '#3a4520',
        },
        // EARTH — text & neutral with sage undertone
        earth: {
          50:  '#fafaf8',
          100: '#f0f2e8',
          200: '#e4e7d4',
          300: '#c8ccb0',
          400: '#8a9070',
          500: '#5a6040',
          600: '#404830',
          700: '#2a3020',
          800: '#1e2210',
          900: '#1e2010',
        },
        // BATIK — icon containers + sidebar charcoal
        batik: {
          50:  '#f2f4e8',
          100: '#eef0e0',
          200: '#e4e7d4',
          300: '#b0bca0',
          400: '#8a9278',
          500: '#5a6448',
          600: '#7A8A52',
          700: '#4F5C30',
          800: '#1B1B1B',
          900: '#0D0D0D',
        },
      },
    },
  },
  plugins: [],
}

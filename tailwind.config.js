/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#ff3d3d',
        'brand-red-dark': '#cc3131',
        'brand-black': '#0c0c12',
        'brand-gray': {
          100: '#141420',
          200: '#1a1a25',
          300: '#666677',
          400: 'rgba(255,255,255,0.05)',
          500: 'rgba(255,255,255,0.1)',
          600: 'rgba(255,255,255,0.2)',
          700: 'rgba(255,255,255,0.3)',
          800: 'rgba(255,255,255,0.5)',
          900: 'rgba(255,255,255,0.7)',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

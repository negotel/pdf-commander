/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e45c32',
        'primary-light': '#f77349',
        'primary-dark': '#c54a2a',
        secondary: '#10B981',
        'orange': {
          50: '#fef7f0',
          100: '#fdeee1',
          200: '#fbd5c2',
          300: '#f8b993',
          400: '#f59364',
          500: '#e45c32',
          600: '#c54a2a',
          700: '#a63d22',
          800: '#87301b',
          900: '#6b2517'
        }
      }
    },
  },
  plugins: [],
}


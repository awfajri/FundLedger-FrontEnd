/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: '#5B21B6',
        secondary: '#7C3AED',
        background: '#F8FAFC',
        surface: '#FFFFFF',
      },
    },
  },
  plugins: [],
}

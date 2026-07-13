/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xxs': '0.65rem',
      },
      boxShadow: {
        DEFAULT: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
      },
      colors: {
        indigo: {
          50: '#f4f4f5',
          100: '#e4e4e7',
          200: '#d4d4d8',
          300: '#a1a1aa',
          400: '#ffffff',
          500: '#f4f4f5',
          600: 'rgba(255, 255, 255, 0.09)',
          700: 'rgba(255, 255, 255, 0.18)',
          800: 'rgba(255, 255, 255, 0.24)',
          900: 'rgba(255, 255, 255, 0.35)',
        },
        purple: {
          50: '#f4f4f5',
          100: '#e4e4e7',
          200: '#d4d4d8',
          300: '#a1a1aa',
          400: '#ffffff',
          500: '#f4f4f5',
          600: 'rgba(255, 255, 255, 0.09)',
          700: 'rgba(255, 255, 255, 0.18)',
          800: 'rgba(255, 255, 255, 0.24)',
          900: 'rgba(255, 255, 255, 0.35)',
        },
        pink: {
          400: '#a1a1aa',
        },
        slate: {
          50: '#f4f4f5',
          100: '#e4e4e7',
          200: '#d4d4d8',
          300: '#a1a1aa',
          450: '#71717a',
          500: '#71717a',
          550: '#52525b',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          850: '#18181b',
          900: '#09090b',
          950: '#030303',
        }
      }
    },
  },
  plugins: [],
}

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
      colors: {
        slate: {
          850: '#151f32',
          950: '#070a13',
        }
      }
    },
  },
  plugins: [],
}

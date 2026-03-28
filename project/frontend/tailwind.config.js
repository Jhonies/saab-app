/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        blood: {
          600: '#7f1d1d',
          700: '#6b1515',
          800: '#560f0f',
        },
        surface: {
          900: '#1a1a1a',
          800: '#222222',
          700: '#2a2a2a',
          600: '#333333',
        },
      },
    },
  },
  plugins: [],
}

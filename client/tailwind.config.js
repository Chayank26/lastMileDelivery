/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Slate Industrial Palette
        slate: {
          950: '#09090b',
          900: '#121215',
          850: '#18181c',
          800: '#27272a',
          700: '#3f3f46',
        },
        brand: {
          50: '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          accent: '#10b981',
        }
      },
    },
  },
  plugins: [],
}

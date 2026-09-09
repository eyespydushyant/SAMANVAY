/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dept: {
          engineering: '#3B82F6',
          st: '#F97316',
          trd: '#10B981',
          merged: '#8B5CF6',
        },
        severity: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#6B7280',
        },
        brand: {
          DEFAULT: '#6366F1',
        },
        card: '#1E293B',
      }
    },
  },
  plugins: [],
}

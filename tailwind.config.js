/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}', './app/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      borderRadius:{
        lg: 'var(--radius)',
        md: 'calc(var(--radius)-2px)',
      }
    },
  },
  plugins: [],
}


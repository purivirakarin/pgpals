/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ed',
          100: '#dbefd1', 
          200: '#bae0a8',
          300: '#8fcc75',
          400: '#6ab548',
          500: '#4e8a2f',
          600: '#2e601b', // RGB(46, 96, 27)
          700: '#254f17',
          800: '#1f3f15',
          900: '#1a3414',
        },
      },
    },
  },
  plugins: [],
}
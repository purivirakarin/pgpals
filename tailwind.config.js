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
          50: '#fdfcff',
          100: '#f8f6ff', 
          200: '#ede9fe',
          300: '#d8d3f0',
          400: '#b5a8d1',
          500: '#9187b3',
          600: '#7c6ba5', // Main muted purple
          700: '#695a96',
          800: '#4d4373',
          900: '#3b3456',
        },
        accent: {
          50: '#fefefe',
          100: '#fdfdfd',
          200: '#f9f9f9',
          300: '#f1f1f1',
          400: '#e6e6e6',
          500: '#d1d1d1', // Subtle grays
          600: '#a3a3a3',
          700: '#737373',
          800: '#525252',
          900: '#404040',
        },
        muted: {
          50: '#fbfafc',
          100: '#f4f2f7',
          200: '#e8e4ee',
          300: '#d3cde0',
          400: '#a89bb8',
          500: '#8b7da1',
          600: '#6b5b87',
          700: '#534563',
          800: '#423654',
          900: '#322740',
        }
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #7c6ba5 0%, #4d4373 50%, #3b3456 100%)',
        'gradient-light': 'linear-gradient(135deg, #f8f6ff 0%, #ede9fe 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
      }
    },
  },
  plugins: [],
}
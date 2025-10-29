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
        // Splitlyr Primary Colors
        primary: {
          25: '#F0FDFA',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6', // Main primary
          600: '#0D9488',
          700: '#0F766E', // Darker primary for active states
          800: '#115E59',
          900: '#134E4A',
        },
        // Status colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        // Background colors
        'background-primary': '#FFFFFF',
        'background-secondary': '#F8FAFC',
        'background-tertiary': '#F1F5F9',
        'background-body': '#F3F6F9',
        // Text colors
        'text-primary': '#0F172A',
        'text-secondary': '#334155',
        'text-tertiary': '#64748B',
        'text-quaternary': '#94A3B8',
        // Border colors
        'border-light': '#F1F5F9',
        'border-medium': '#E2E8F0',
        'border-dark': '#CBD5E1',
      },
      backgroundImage: {
        'splitlyr-gradient': 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
        'splitlyr-gradient-light': 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
      }
    },
  },
  plugins: [],
}
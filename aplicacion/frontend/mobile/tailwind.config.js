/** @type {import('tailwindcss').Config} */
const { BRAND_COLORS } = require('../../shared/types/brandColors.cjs')

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          red: BRAND_COLORS.red,
          red700: BRAND_COLORS.red700,
          gold: BRAND_COLORS.gold,
          cream: BRAND_COLORS.cream,
        },
      },
      spacing: {
        15: '60px',
        22.5: '90px',
        30: '120px',
        35: '140px',
      },
    },
  },
  plugins: [],
}

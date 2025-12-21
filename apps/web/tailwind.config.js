/** @type {import('tailwindcss').Config} */
const { BRAND_COLORS } = require('../../packages/shared-types/brandColors.cjs')

module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
        22.5: '90px',
        30: '120px',
        35: '140px',
      },
    },
  },
  plugins: [],
}

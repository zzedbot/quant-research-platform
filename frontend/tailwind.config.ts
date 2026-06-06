import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0F766E', foreground: '#FFFFFF' },
        bullish: '#26A69A',
        bearish: '#EF5350',
      },
    },
  },
  plugins: [],
} satisfies Config

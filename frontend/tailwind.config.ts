import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e17',
        surface: '#111827',
        border: { DEFAULT: '#1e2d3d' },
        primary: { DEFAULT: '#0F766E', foreground: '#FFFFFF' },
        muted: { DEFAULT: '#64748b', foreground: '#94a3b8' },
        dim: '#475569',
        bullish: '#26A69A',
        bearish: '#EF5350',
      },
    },
  },
  plugins: [],
} satisfies Config

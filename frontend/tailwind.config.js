/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0f131c',
        'canvas-dim': '#0a0e16',
        surface: '#181c24',
        'surface-elevated': '#1c2028',
        'surface-hover': '#262a33',
        border: '#2a2f3a',
        teal: {
          DEFAULT: '#0df2c9',
          dim: '#00e0b9',
          muted: '#4fdbc8',
        },
        accent: '#0ea5e9',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'metric-xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.03em' }],
        'metric-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
        'metric-md': ['18px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
        'metric-sm': ['14px', { lineHeight: '20px', letterSpacing: '-0.01em' }],
        label: ['11px', { lineHeight: '14px', letterSpacing: '0.04em' }],
      },
    },
  },
  plugins: [],
}

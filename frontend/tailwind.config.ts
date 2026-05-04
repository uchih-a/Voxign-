import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0C1A12',
          surface: '#111F16',
          elevated: '#172A1E',
        },
        accent: {
          DEFAULT: '#4ADE80',
          soft: '#86EFAC',
          deep: '#166534',
          glow: 'rgba(74, 222, 128, 0.25)',
        },
        cream: {
          DEFAULT: '#FAF3E0',
          muted: '#D4C9A8',
          dim: '#5C5443',
        },
        status: {
          success: '#4ADE80',
          warning: '#FBBF24',
          error: '#F87171',
        },
        border: {
          subtle: 'rgba(74, 222, 128, 0.12)',
          active: 'rgba(74, 222, 128, 0.45)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        btn: '14px',
        input: '10px',
        pill: '9999px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)',
          },
          '50%': {
            opacity: '0.7',
            boxShadow: '0 0 10px rgba(74, 222, 128, 0.25)',
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

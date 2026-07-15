/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f0d',
          card:    '#161613',
          border:  'rgba(255,255,255,0.07)',
          muted:   '#252520',
        },
        bone:  '#f0ece3',
        warm:  '#7a7268',
        gold:  '#b8956a',
        bull:    { DEFAULT: '#22c55e', dim: 'rgba(34,197,94,0.1)',    text: '#4ade80' },
        bear:    { DEFAULT: '#ef4444', dim: 'rgba(239,68,68,0.1)',    text: '#f87171' },
        caution: { DEFAULT: '#f59e0b', dim: 'rgba(245,158,11,0.1)',   text: '#fbbf24' },
        accent:  { DEFAULT: '#b8956a', dim: 'rgba(184,149,106,0.12)', text: '#c9a87c' },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono:  ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'pulse-slow':  'pulseSlow 2.8s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':     'fadeIn 0.4s cubic-bezier(.16,1,.3,1) both',
        'slide-up':    'slideUp 0.55s cubic-bezier(.16,1,.3,1) both',
        'shimmer':     'shimmer 2s ease-in-out infinite',
        'page-enter':  'pageFadeIn 0.45s cubic-bezier(.16,1,.3,1) both',
        'ticker':      'ticker 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(14px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pageFadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.3' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400% 0' },
          '100%': { backgroundPosition:  '400% 0' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}

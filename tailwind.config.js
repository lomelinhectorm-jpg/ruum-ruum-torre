/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-display)', 'Space Grotesk', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        rr: {
          asphalt: '#14141A',
          asphalt2: '#1E1F28',
          asphalt3: '#2A2B36',
          route: '#FFC400',
          routeDark: '#E0A800',
          trace: '#3D7BFF',
          traceDeep: '#1A3D8F',
          steel: '#6B7280',
          steelLight: '#9CA3AF',
          evidence: '#F7F6F2',
          success: '#1FAE63',
          danger: '#E0334E',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

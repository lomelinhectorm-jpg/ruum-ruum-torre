import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'rr-asphalt': '#14141A',
        'rr-asphalt2': '#1E1F28',
        'rr-asphalt3': '#2A2B36',
        'rr-route': '#FFC400',
        'rr-routeDark': '#E0A800',
        'rr-trace': '#3D7BFF',
        'rr-traceDeep': '#1A3D8F',
        'rr-steel': '#6B7280',
        'rr-steelLight': '#9CA3AF',
        'rr-evidence': '#F7F6F2',
        'rr-success': '#1FAE63',
        'rr-danger': '#E0334E',
      },
    },
  },
  plugins: [],
}

export default config

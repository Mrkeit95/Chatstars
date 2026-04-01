import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0c0a09', 2: '#161311', card: '#1a1714', card2: '#1f1c18' },
        border: { DEFAULT: 'rgba(255,255,255,0.06)', 2: 'rgba(255,255,255,0.03)' },
        accent: { green: '#4ade80', yellow: '#facc15', orange: '#fb923c', blue: '#60a5fa', red: '#f87171', cyan: '#22d3ee', purple: '#a78bfa', pink: '#f472b6' },
        txt: { DEFAULT: '#f5f5f4', 2: '#a8a29e', 3: '#78716c', 4: '#57534e' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;

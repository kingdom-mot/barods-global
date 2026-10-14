import type { Config } from 'tailwindcss';

// Barods Global brand colours, taken from the official logo.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#56B91E',      // logo green (fills, buttons)
          greenDark: '#3D7F16',  // text-safe green on white
          greenLight: '#EEF8E7', // tints
          ink: '#231F20',        // logo charcoal
          orange: '#DD6236',     // "Real Estate and Construction" tagline
        },
        line: '#E3E6EA',
        muted: '#5B6168',
        paper: '#F6F7F5',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      maxWidth: { site: '1200px' },
    },
  },
  plugins: [],
};

export default config;

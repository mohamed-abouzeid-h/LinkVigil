/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./linkvigil/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#030712',
          900: '#090d16',
          850: '#0e1424',
          800: '#151d32',
          700: '#1e2942',
          600: '#2c3b5d',
          border: 'rgba(56, 189, 248, 0.15)',
          neonCyan: '#06b6d4',
          neonEmerald: '#10b981',
          neonAmber: '#f59e0b',
          neonRose: '#f43f5e',
          neonViolet: '#8b5cf6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radar 2.5s linear infinite',
        'scanline': 'scanline 6s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        glow: {
          '0%': { opacity: '0.4', filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.4))' },
          '100%': { opacity: '0.8', filter: 'drop-shadow(0 0 25px rgba(6, 182, 212, 0.8))' },
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.45)',
        'neon-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.45)',
        'neon-rose': '0 0 25px -3px rgba(244, 63, 94, 0.55)',
        'neon-amber': '0 0 20px -3px rgba(245, 158, 11, 0.45)',
        'cyber-card': '0 10px 30px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}

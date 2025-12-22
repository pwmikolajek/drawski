/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 100px 80px 0 rgba(50, 70, 86, 0.04), 0 41.778px 33.422px 0 rgba(50, 70, 86, 0.03), 0 22.336px 17.869px 0 rgba(50, 70, 86, 0.02), 0 12.522px 10.017px 0 rgba(50, 70, 86, 0.02), 0 6.65px 5.32px 0 rgba(50, 70, 86, 0.02), 0 2.767px 2.214px 0 rgba(50, 70, 86, 0.01)',
          },
          '50%': {
            opacity: '0.9',
            boxShadow: '0 100px 80px 0 rgba(50, 70, 86, 0.04), 0 41.778px 33.422px 0 rgba(50, 70, 86, 0.03), 0 22.336px 17.869px 0 rgba(50, 70, 86, 0.02), 0 12.522px 10.017px 0 rgba(50, 70, 86, 0.02), 0 6.65px 5.32px 0 rgba(50, 70, 86, 0.02), 0 2.767px 2.214px 0 rgba(50, 70, 86, 0.01)',
          },
        },
      },
      boxShadow: {
        'custom-shadow': '0 100px 80px 0 rgba(50, 70, 86, 0.04), 0 41.778px 33.422px 0 rgba(50, 70, 86, 0.03), 0 22.336px 17.869px 0 rgba(50, 70, 86, 0.02), 0 12.522px 10.017px 0 rgba(50, 70, 86, 0.02), 0 6.65px 5.32px 0 rgba(50, 70, 86, 0.02), 0 2.767px 2.214px 0 rgba(50, 70, 86, 0.01)',
      },
      borderRadius: {
        'custom-radius': '8px',
      },
      backgroundImage: {
        'custom-background': 'url(<path-to-image>) lightgray 50% / cover no-repeat',
      }
    },
  },
  plugins: [],
}
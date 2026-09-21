import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderColor: {
        DEFAULT: '#E2E8F0',
      },
      colors: {
        primary: { DEFAULT: '#2563EB', light: '#EFF6FF', dark: '#1E40AF' },
        success: { DEFAULT: '#16A34A', light: '#F0FDF4' },
        warning: { DEFAULT: '#D97706', light: '#FFFBEB' },
        danger:  { DEFAULT: '#DC2626', light: '#FEF2F2' },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;

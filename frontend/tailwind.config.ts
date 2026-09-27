import type { Config } from 'tailwindcss';

/**
 * Every colour here resolves to a CSS variable declared in app/globals.css, so
 * light and dark themes share one set of names and no component needs to know
 * which theme is active.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: token('paper'),
        surface: {
          DEFAULT: token('surface'),
          sunken: token('surface-sunken'),
        },
        wash: token('wash'),

        ink: {
          DEFAULT: token('ink'),
          muted: token('ink-muted'),
          subtle: token('ink-subtle'),
        },

        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },

        brand: {
          DEFAULT: token('brand'),
          hover: token('brand-hover'),
          contrast: token('brand-contrast'),
          wash: token('brand-wash'),
        },

        highlighter: {
          DEFAULT: token('highlighter'),
          wash: token('highlighter-wash'),
        },

        success: { DEFAULT: token('success'), bg: token('success-bg') },
        danger: { DEFAULT: token('danger'), bg: token('danger-bg') },
        warning: { DEFAULT: token('warning'), bg: token('warning-bg') },
        info: { DEFAULT: token('info'), bg: token('info-bg') },

        subject: {
          ban: token('subj-ban'),
          eng: token('subj-eng'),
          mat: token('subj-mat'),
          sci: token('subj-sci'),
          ict: token('subj-ict'),
          bgs: token('subj-bgs'),
          hss: token('subj-hss'),
          rel: token('subj-rel'),
        },
      },

      borderColor: {
        DEFAULT: 'rgb(var(--line))',
      },

      // Different radii per level, so hierarchy reads without shadows.
      borderRadius: {
        chip: 'var(--r-chip)',
        btn: 'var(--r-btn)',
        card: 'var(--r-card)',
        dialog: 'var(--r-dialog)',
      },

      fontFamily: {
        sans: ['var(--font-ui)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        bn: ['var(--font-bn)', 'var(--font-ui)', 'sans-serif'],
      },

      fontSize: {
        meta: ['0.75rem', { lineHeight: '1.4' }],
        label: ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }],
        dense: ['0.84375rem', { lineHeight: '1.45' }],
        body: ['0.90625rem', { lineHeight: '1.55' }],
        section: ['1.0625rem', { lineHeight: '1.35', fontWeight: '600' }],
        page: ['1.6875rem', { lineHeight: '1.2', fontWeight: '600' }],
      },

      // `card` is deliberately barely-there: it exists so a surface reads as
      // a distinct object against `paper` even where `line` and `paper` are
      // too close in lightness for the border alone to register — not a
      // decorative drop shadow. `card-hover` is one step up, used only as a
      // response to a pointer over something interactive. `popover`/`dialog`
      // stay reserved for things that genuinely float.
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 1px 0 rgb(15 23 42 / 0.03)',
        'card-hover': '0 4px 10px -2px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        popover: '0 4px 16px -2px rgb(9 12 28 / 0.12), 0 2px 6px -2px rgb(9 12 28 / 0.08)',
        dialog: '0 24px 48px -12px rgb(9 12 28 / 0.28), 0 8px 20px -8px rgb(9 12 28 / 0.16)',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translate(-50%, -50%) scale(0.97)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        'slide-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        // The homepage news strip: the list is rendered twice, so moving by
        // half its width lands exactly where it started — a seamless loop.
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'scale-in': 'scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-from-right': 'slide-from-right 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-from-bottom': 'slide-from-bottom 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        marquee: 'marquee var(--marquee-duration, 40s) linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')({ strategy: 'class' })],
};

export default config;

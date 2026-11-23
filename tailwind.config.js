/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          raised: 'hsl(var(--surface-raised) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          hover: 'hsl(var(--primary-hover) / <alpha-value>)',
          subtle: 'hsl(var(--primary-subtle) / <alpha-value>)',
          border: 'hsl(var(--primary-border) / <alpha-value>)',
        },
        'accent-2': {
          DEFAULT: 'hsl(var(--accent-2) / <alpha-value>)',
          foreground: 'hsl(var(--accent-2-foreground) / <alpha-value>)',
          subtle: 'hsl(var(--accent-2-subtle) / <alpha-value>)',
          border: 'hsl(var(--accent-2-border) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        subtle: {
          foreground: 'hsl(var(--subtle-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          foreground: 'hsl(var(--danger-foreground) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--border) / <alpha-value>)',
          strong: 'hsl(var(--border-strong) / <alpha-value>)',
        },
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        glow: 'hsl(var(--glow) / <alpha-value>)',
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
          subtle: 'hsl(var(--success-subtle) / <alpha-value>)',
          border: 'hsl(var(--success-border) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
          subtle: 'hsl(var(--warning-subtle) / <alpha-value>)',
          border: 'hsl(var(--warning-border) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          foreground: 'hsl(var(--danger-foreground) / <alpha-value>)',
          subtle: 'hsl(var(--danger-subtle) / <alpha-value>)',
          border: 'hsl(var(--danger-border) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          foreground: 'hsl(var(--info-foreground) / <alpha-value>)',
          subtle: 'hsl(var(--info-subtle) / <alpha-value>)',
          border: 'hsl(var(--info-border) / <alpha-value>)',
        },
        chart: {
          1: 'hsl(var(--chart-1) / <alpha-value>)',
          2: 'hsl(var(--chart-2) / <alpha-value>)',
          3: 'hsl(var(--chart-3) / <alpha-value>)',
          4: 'hsl(var(--chart-4) / <alpha-value>)',
          5: 'hsl(var(--chart-5) / <alpha-value>)',
        },
      },
      fontSize: {
        display: ['2.75rem', { lineHeight: '3rem', letterSpacing: '-0.035em', fontWeight: '600' }],
        h1: ['2rem', { lineHeight: '2.375rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        h2: ['1.5rem', { lineHeight: '1.875rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        h3: ['1.125rem', { lineHeight: '1.625rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em', fontWeight: '400' }],
        small: ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '-0.005em', fontWeight: '500' }],
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0em', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        md: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        lg: '0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        overlay: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
        glow: '0 0 0 4px hsl(var(--glow) / 0.15), 0 8px 24px -6px hsl(var(--glow) / 0.5)',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 180ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'rise-in': 'riseIn 200ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'scale-in': 'scaleIn 180ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */

const trophicTokens = {
  // ── Backgrounds ─────────────────────────────────────────────────────────
  'system-bg':         '#000000',        // pure black — page root
  'elevated-1':        '#1c1c1e',        // iOS system background
  'elevated-2':        '#2c2c2e',        // cards, modals
  'elevated-3':        '#3a3a3c',        // secondary surfaces, dividers
  'elevated-4':        '#48484a',        // tertiary / hover states

  // ── Glass surfaces ───────────────────────────────────────────────────────
  'glass-bg':          'rgba(28,28,30,0.72)',
  'glass-border':      'rgba(255,255,255,0.08)',

  // ── Brand accent (Apple blue scale) ─────────────────────────────────────
  'accent':            '#0a84ff',        // primary CTAs
  'accent-hover':      '#409cff',        // lighter on hover
  'accent-dim':        'rgba(10,132,255,0.15)',  // tinted backgrounds

  // ── Semantic status ──────────────────────────────────────────────────────
  'success':           '#30d158',        // green
  'warning':           '#ff9f0a',        // amber
  'danger':            '#ff453a',        // red
  'info':              '#64d2ff',        // teal

  // ── Typography ───────────────────────────────────────────────────────────
  'text-primary':      '#ffffff',
  'text-secondary':    'rgba(235,235,245,0.60)',
  'text-tertiary':     'rgba(235,235,245,0.30)',
  'text-quarternary':  'rgba(235,235,245,0.18)',
};

module.exports = {
  darkMode: 'class',

  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      // ── Color palette ───────────────────────────────────────────────────
      colors: {
        trophic: trophicTokens,
      },

      // ── San Francisco font stack ─────────────────────────────────────────
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"Fira Code"',
          '"Cascadia Code"',
          'Menlo',
          'Monaco',
          'monospace',
        ],
      },

      // ── Typography scale (SF Pro optical sizing) ─────────────────────────
      fontSize: {
        'display-xl': ['56px', { lineHeight: '1.07', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-lg': ['40px', { lineHeight: '1.1',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'display':    ['32px', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'title-1':    ['28px', { lineHeight: '1.2',  letterSpacing: '-0.01em',  fontWeight: '600' }],
        'title-2':    ['22px', { lineHeight: '1.27', letterSpacing: '-0.005em', fontWeight: '600' }],
        'title-3':    ['20px', { lineHeight: '1.3',  letterSpacing: '0em',      fontWeight: '600' }],
        'headline':   ['17px', { lineHeight: '1.35', letterSpacing: '-0.002em', fontWeight: '600' }],
        'body':       ['17px', { lineHeight: '1.52', letterSpacing: '-0.002em', fontWeight: '400' }],
        'callout':    ['16px', { lineHeight: '1.5',  letterSpacing: '0em',      fontWeight: '400' }],
        'subhead':    ['15px', { lineHeight: '1.46', letterSpacing: '0em',      fontWeight: '400' }],
        'footnote':   ['13px', { lineHeight: '1.38', letterSpacing: '0em',      fontWeight: '400' }],
        'caption-1':  ['12px', { lineHeight: '1.33', letterSpacing: '0em',      fontWeight: '400' }],
        'caption-2':  ['11px', { lineHeight: '1.27', letterSpacing: '0.006em',  fontWeight: '400' }],
      },

      // ── Border radius (Apple rounded corners) ────────────────────────────
      borderRadius: {
        'xs':    '6px',
        'sm':    '8px',
        'md':    '12px',   // default card radius
        'lg':    '16px',   // modals, sheets
        'xl':    '20px',
        '2xl':   '24px',
        '3xl':   '32px',
        'pill':  '9999px',
      },

      // ── Shadows (deep, soft — Apple style) ───────────────────────────────
      boxShadow: {
        'card':      '0 2px 8px rgba(0,0,0,0.32), 0 0 0 0.5px rgba(255,255,255,0.06)',
        'elevated':  '0 8px 32px rgba(0,0,0,0.48), 0 0 0 0.5px rgba(255,255,255,0.06)',
        'modal':     '0 24px 80px rgba(0,0,0,0.72), 0 0 0 0.5px rgba(255,255,255,0.08)',
        'glow-blue': '0 0 24px rgba(10,132,255,0.35)',
        'glow-green':'0 0 24px rgba(48,209,88,0.35)',
        'inset-top': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },

      // ── Backdrop blur (glassmorphism) ─────────────────────────────────────
      backdropBlur: {
        'xs':   '4px',
        'sm':   '8px',
        'md':   '16px',    // nav bars
        'lg':   '24px',    // modals
        'xl':   '40px',
        'vibrancy': '72px', // heavy glass
      },

      // ── Transitions ───────────────────────────────────────────────────────
      transitionTimingFunction: {
        'apple-ease':    'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
        'apple-spring':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'apple-out':     'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '350': '350ms',
        '500': '500ms',
      },

      // ── Spacing additions ─────────────────────────────────────────────────
      spacing: {
        '4.5': '18px',
        '13':  '52px',
        '18':  '72px',
        '22':  '88px',
      },

      // ── Animations ────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(10,132,255,0.4)' },
          '50%':      { boxShadow: '0 0 24px rgba(10,132,255,0.8)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.35s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'scale-in':   'scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up':   'slide-up 0.45s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
  ],
};

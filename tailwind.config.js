/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-card-hover': 'var(--color-surface-card-hover)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        border: 'var(--color-border)',
        'mint-100': 'var(--color-mint-100)',
        'lavender-bg': 'var(--color-lavender-bg)',
        'lavender-text': 'var(--color-lavender-text)',
        'disabled-bg': 'var(--color-disabled-bg)',
        'disabled-text': 'var(--color-disabled-text)',
        'pill-bg': 'var(--color-pill-bg)',
        'pill-bg-hover': 'var(--color-pill-bg-hover)'
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)']
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.3' }],
        sm: ['13px', { lineHeight: '1.4' }],
        base: ['14px', { lineHeight: '1.5' }],
        md: ['16px', { lineHeight: '1.5' }],
        lg: ['20px', { lineHeight: '1.3' }],
        xl: ['28px', { lineHeight: '1.15' }],
        '2xl': ['36px', { lineHeight: '1.15' }],
        displaySm: ['28px', { lineHeight: '1.1' }],
        displayMd: ['40px', { lineHeight: '1.1' }]
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px'
      },
      borderRadius: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px'
      },
      boxShadow: {
        popup: '0 20px 60px rgba(33, 31, 27, 0.18)',
        card: '0 1px 2px rgba(33, 31, 27, 0.04), 0 2px 8px rgba(33, 31, 27, 0.05)',
        raised: '0 4px 16px rgba(33, 31, 27, 0.08), 0 1px 3px rgba(33, 31, 27, 0.06)',
        modal: '0 20px 60px rgba(33, 31, 27, 0.18)',
        focusRing: '0 0 0 3px rgba(47, 79, 66, 0.28)'
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  },
  plugins: []
}

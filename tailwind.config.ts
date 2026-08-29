import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0A',
        background: '#fbf9f9',
        surface: '#fbf9f9',
        'surface-dim': '#dbdad9',
        'surface-bright': '#fbf9f9',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f5f3f3',
        'surface-container': '#efeded',
        'surface-container-high': '#e9e8e7',
        'surface-container-highest': '#e3e2e2',
        'on-surface': '#1b1c1c',
        'on-surface-variant': '#444748',
        'inverse-surface': '#303031',
        'inverse-on-surface': '#f2f0f0',
        outline: '#747878',
        'outline-variant': '#c4c7c7',
        accent: '#00F0FF',
        cyan: {
          accent: '#00F0FF',
        },
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        secondary: '#5d5f5f',
        'on-secondary': '#ffffff',
        'secondary-container': '#dfe0e0',
        'on-secondary-container': '#616363',
      },
      borderRadius: {
        DEFAULT: '0.125rem', // 2px (Soft brutalist look)
        lg: '0.25rem', // 4px
        xl: '0.5rem', // 8px
        full: '9999px',
      },
      spacing: {
        base: '4px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        gutter: '12px',
        'container-margin': '16px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-oswald)', 'sans-serif'],
      },
      boxShadow: {
        brutalist: '4px 4px 0px 0px #0A0A0A',
        'brutalist-hover': '2px 2px 0px 0px #0A0A0A',
        'brutalist-cyan': '4px 4px 0px 0px #00F0FF',
      },
    },
  },
  plugins: [],
}
export default config

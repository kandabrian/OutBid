import type { Config } from 'tailwindcss'
import { theme } from './src/lib/theme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: theme.colors.slate,
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        success: theme.colors.success,
        danger: theme.colors.danger,
        warning: theme.colors.warning,
        info: theme.colors.info,
      },
      backgroundColor: {
        base: theme.colors.bg.primary,
        overlay: theme.colors.bg.overlay,
      },
      textColor: {
        base: theme.colors.text.primary,
        secondary: theme.colors.text.secondary,
        tertiary: theme.colors.text.tertiary,
        muted: theme.colors.text.muted,
      },
      borderColor: {
        base: theme.colors.border,
      },
      fontFamily: {
        sans: theme.typography.fontFamily.sans,
        mono: theme.typography.fontFamily.mono,
      },
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeight,
      lineHeight: theme.typography.lineHeight,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      boxShadow: theme.shadows,
      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      backgroundImage: {
        'gradient-primary': theme.colors.gradients.primary,
        'gradient-success': theme.colors.gradients.success,
        'gradient-dark': theme.colors.gradients.dark,
      },
      zIndex: theme.zIndex,
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-gentle': 'bounce-gentle 1s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

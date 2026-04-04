/**
 * Design System Theme
 * Centralized color palette, typography, spacing, and component tokens
 * Used by Tailwind and component libraries
 */

export const theme = {
  colors: {
    // Brand Colors
    primary: '#6366f1', // Indigo - Primary CTAs, active states
    secondary: '#ec4899', // Pink - Alerts, bids, actions
    success: '#10b981', // Emerald - Wins, confirmations
    danger: '#ef4444', // Red - Losses, errors
    warning: '#f59e0b', // Amber - Pending, attention
    info: '#3b82f6', // Blue - Information

    // Grays (Dark-first, accessible)
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },

    // Semantic
    bg: {
      primary: '#0f172a', // Dark background
      secondary: '#1e293b',
      tertiary: '#334155',
      overlay: 'rgba(15, 23, 42, 0.8)', // Semi-transparent dark
    },
    text: {
      primary: '#f8fafc', // Light text on dark
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      muted: '#64748b',
    },
    border: '#334155',

    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    },
  },

  typography: {
    // Font families
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      mono: [
        '"JetBrains Mono"',
        '"Courier New"',
        'monospace',
      ].join(','),
    },

    // Font sizes
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      '4xl': '40px',
    },

    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },

    // Font weights
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  spacing: {
    // 8px base scale
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  // Z-index scale
  zIndex: {
    hidden: '-1',
    base: '0',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modal: '1040',
    tooltip: '1070',
  },
}

// Component-specific tokens
export const componentTokens = {
  button: {
    primary: {
      bg: 'bg-indigo-600 hover:bg-indigo-700',
      text: 'text-white',
      border: 'border-indigo-600 hover:border-indigo-700',
    },
    secondary: {
      bg: 'bg-slate-700 hover:bg-slate-600',
      text: 'text-slate-50',
      border: 'border-slate-600 hover:border-slate-500',
    },
    danger: {
      bg: 'bg-red-600 hover:bg-red-700',
      text: 'text-white',
      border: 'border-red-600 hover:border-red-700',
    },
    ghost: {
      bg: 'hover:bg-slate-800',
      text: 'text-slate-50 hover:text-white',
      border: 'border-slate-600 hover:border-slate-500',
    },
  },

  card: {
    bg: 'bg-slate-800',
    border: 'border border-slate-700',
    shadow: 'shadow-md',
    rounded: 'rounded-lg',
  },

  input: {
    bg: 'bg-slate-900',
    border: 'border border-slate-700 focus:border-indigo-500',
    text: 'text-slate-50',
    placeholder: 'placeholder-slate-500',
  },

  badge: {
    primary: 'bg-indigo-900 text-indigo-200 border-indigo-700',
    success: 'bg-emerald-900 text-emerald-200 border-emerald-700',
    danger: 'bg-red-900 text-red-200 border-red-700',
    warning: 'bg-amber-900 text-amber-200 border-amber-700',
  },

  overlay: {
    glass: 'bg-slate-800/60 backdrop-blur-md border border-slate-700/50',
  },
}

export type Theme = typeof theme
export type ComponentTokens = typeof componentTokens

/**
 * Button component - Accessible, semantic, reusable
 * Supports: primary, secondary, danger, ghost variants
 * Sizes: sm, md, lg | States: loading, disabled, active
 */

import React, { ReactNode, ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  icon?: ReactNode
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border border-indigo-600 hover:border-indigo-700',
  secondary: 'bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-50 border border-slate-600 hover:border-slate-500',
  danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-600 hover:border-red-700',
  ghost: 'hover:bg-slate-800 text-slate-50 border border-transparent hover:border-slate-700 active:bg-slate-700',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm font-medium rounded-md',
  md: 'px-4 py-2 text-base font-medium rounded-lg',
  lg: 'px-6 py-3 text-lg font-semibold rounded-lg',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'font-sans font-medium transition-all duration-200 flex items-center justify-center gap-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClass = variantClasses[variant]
    const sizeClass = sizeClasses[size]

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !isLoading && <span className="flex items-center">{icon}</span>}
        <span>{children}</span>
      </button>
    )
  },
)

Button.displayName = 'Button'

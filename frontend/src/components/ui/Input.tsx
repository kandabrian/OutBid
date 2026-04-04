/**
 * Input component - Form input with integrated label, error, and validation
 * Supports: text, email, password, number, tel, url
 * States: focus, error, disabled, loading
 */

import React, { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  isLoading?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helpText,
      icon,
      iconPosition = 'right',
      isLoading = false,
      className = '',
      type = 'text',
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-50 placeholder-slate-500 rounded-lg px-4 py-2.5 font-sans text-base transition-all duration-200 outline-none'

    const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-100 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            disabled={disabled || isLoading}
            className={`${baseClasses} ${errorClasses} ${disabledClasses} ${
              icon && iconPosition === 'left' ? 'pl-10' : ''
            } ${icon && iconPosition === 'right' ? 'pr-10' : ''} ${className}`}
            {...props}
          />

          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5"
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
              ) : (
                icon
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm font-medium text-red-400 mt-1" role="alert">
            {error}
          </p>
        )}

        {helpText && !error && (
          <p className="text-sm text-slate-400 mt-1">{helpText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

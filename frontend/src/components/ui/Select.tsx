/**
 * Select component - Dropdown select with label and error handling
 */

import React, { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, options, placeholder, className = '', ...props },
    ref,
  ) => {
    const baseClasses =
      'w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-50 rounded-lg px-4 py-2.5 font-sans text-base transition-all duration-200 outline-none'

    const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-100 mb-2">
            {label}
          </label>
        )}

        <select
          ref={ref}
          className={`${baseClasses} ${errorClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-sm font-medium text-red-400 mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'

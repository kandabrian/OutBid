/**
 * Checkbox component - Accessible checkbox with label
 */

import React, { InputHTMLAttributes } from 'react'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex items-start gap-2">
        <input
          ref={ref}
          type="checkbox"
          className={`w-5 h-5 mt-0.5 bg-slate-900 border border-slate-700 rounded accent-indigo-600 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {label && (
          <label className="text-sm text-slate-300 cursor-pointer">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'

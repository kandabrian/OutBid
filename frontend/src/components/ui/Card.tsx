/**
 * Card component - Consistent container for content
 * Supports: standard, elevated, interactive variants
 * Props: title, description, footer, clickable, highlighted
 */

import React, { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: ReactNode
  description?: string
  footer?: ReactNode
  isClickable?: boolean
  isHighlighted?: boolean
  onClick?: () => void
  className?: string
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  footer,
  isClickable = false,
  isHighlighted = false,
  onClick,
  className = '',
}) => {
  const baseClasses = 'bg-slate-800 rounded-lg border transition-all duration-200'
  const borderClasses = isHighlighted
    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
    : 'border-slate-700 shadow-md'
  const hoverClasses = isClickable ? 'hover:border-indigo-400 hover:shadow-lg cursor-pointer' : ''

  return (
    <div
      className={`${baseClasses} ${borderClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClick?.()
              }
            }
          : undefined
      }
    >
      {title && (
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
          {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
        </div>
      )}

      <div className={title ? 'px-6 py-4' : 'p-6'}>{children}</div>

      {footer && (
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50">
          {footer}
        </div>
      )}
    </div>
  )
}

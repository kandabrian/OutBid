/**
 * Badge component - Small label or status indicator
 * Variants: primary, success, danger, warning
 * Sizes: sm, md, lg
 */

import React from 'react'

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-indigo-900 text-indigo-200 border-indigo-700',
  success: 'bg-emerald-900 text-emerald-200 border-emerald-700',
  danger: 'bg-red-900 text-red-200 border-red-700',
  warning: 'bg-amber-900 text-amber-200 border-amber-700',
  info: 'bg-blue-900 text-blue-200 border-blue-700',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs font-medium',
  md: 'px-3 py-1 text-sm font-medium',
  lg: 'px-4 py-1.5 text-base font-medium',
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center border rounded-full'
  const variantClass = variantClasses[variant]
  const sizeClass = sizeClasses[size]

  return (
    <span className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}>
      {children}
    </span>
  )
}

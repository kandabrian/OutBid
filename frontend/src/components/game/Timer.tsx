/**
 * Timer component - Countdown display with visual urgency
 * Features: color coding (green → yellow → red), audio alert on finish
 * Used in: Match game screen, rounds, bidding phases
 */

import React, { useEffect, useState } from 'react'

interface TimerProps {
  durationMs: number
  onExpire: () => void
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
}

export const Timer: React.FC<TimerProps> = ({
  durationMs,
  onExpire,
  size = 'md',
  showLabel = true,
  label = 'Time Remaining',
}) => {
  const [remainingMs, setRemainingMs] = useState(durationMs)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (isExpired) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, durationMs - elapsed)

      setRemainingMs(remaining)

      if (remaining === 0) {
        setIsExpired(true)
        clearInterval(interval)
        onExpire()
      }
    }, 100) // Update every 100ms for smooth animation

    return () => clearInterval(interval)
  }, [durationMs, isExpired, onExpire])

  const seconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const displaySeconds = seconds % 60

  // Color urgency
  const getColorClass = () => {
    const percentage = (remainingMs / durationMs) * 100
    if (percentage > 50) return 'text-emerald-400'
    if (percentage > 25) return 'text-amber-400'
    return 'text-red-500'
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  return (
    <div className="text-center">
      {showLabel && (
        <p className="text-sm text-slate-400 mb-2 uppercase tracking-widest">
          {label}
        </p>
      )}

      <div className={`font-mono font-bold ${sizeClasses[size]} ${getColorClass()} transition-colors`}>
        {minutes}:{displaySeconds.toString().padStart(2, '0')}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${
            remainingMs / durationMs > 0.5
              ? 'bg-emerald-500'
              : remainingMs / durationMs > 0.25
                ? 'bg-amber-500'
                : 'bg-red-500'
          }`}
          style={{ width: `${(remainingMs / durationMs) * 100}%` }}
        />
      </div>
    </div>
  )
}

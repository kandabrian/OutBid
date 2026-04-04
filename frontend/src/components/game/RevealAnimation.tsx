/**
 * RevealAnimation component - Smooth animation for bid reveals
 * Features: Framer Motion animations, card flip effect
 * Used in: Match game screen, round transitions
 */

import React, { useState, useEffect } from 'react'

interface RevealAnimationProps {
  isRevealed: boolean
  hiddenText?: string
  revealedValue: string | number
  revealedLabel?: string
  animated?: boolean
}

export const RevealAnimation: React.FC<RevealAnimationProps> = ({
  isRevealed,
  hiddenText = '?',
  revealedValue,
  revealedLabel = 'Bid Amount',
  animated = true,
}) => {
  const [show, setShow] = useState(isRevealed)

  useEffect(() => {
    if (animated && isRevealed) {
      // Small delay for effect
      const timer = setTimeout(() => {
        setShow(true)
      }, 100)
      return () => clearTimeout(timer)
    }
    setShow(isRevealed)
  }, [isRevealed, animated])

  return (
    <div className="relative h-32 w-full perspective">
      {/* Card container with flip animation */}
      <div
        className={`absolute inset-0 transition-all duration-700 transform ${
          show ? '[transform:rotateY(360deg)]' : '[transform:rotateY(0deg)]'
        }`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Hidden state (front) */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg border-2 border-slate-600 flex flex-col items-center justify-center transition-opacity ${
            show ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <p className="text-6xl font-bold text-slate-500">{hiddenText}</p>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest">Hidden</p>
        </div>

        {/* Revealed state (back) */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-lg border-2 border-indigo-400 flex flex-col items-center justify-center transition-opacity ${
            show ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-xs text-indigo-100 uppercase tracking-widest mb-2">
            {revealedLabel}
          </p>
          <p className="text-4xl font-extrabold text-white">
            {typeof revealedValue === 'number'
              ? `$${(revealedValue / 100).toFixed(2)}`
              : revealedValue}
          </p>
        </div>
      </div>
    </div>
  )
}

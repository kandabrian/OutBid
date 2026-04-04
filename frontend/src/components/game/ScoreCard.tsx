/**
 * ScoreCard component - Display player's score, streak, and stats
 * Features: animated number counters, visual rank indicators
 * Used in: Match game screen, leaderboards
 */

import React, { useEffect, useState } from 'react'
import { Badge } from '../ui'

interface ScoreCardProps {
  playerName: string
  score: number
  bid: number | null
  isCurrentPlayer?: boolean
  isWinning?: boolean
  bidRevealed?: boolean
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  playerName,
  score,
  bid,
  isCurrentPlayer = false,
  isWinning = false,
  bidRevealed = false,
}) => {
  const [displayScore, setDisplayScore] = useState(score)

  // Animate score changes
  useEffect(() => {
    if (displayScore !== score) {
      const interval = setInterval(() => {
        setDisplayScore((prev) => {
          const diff = Math.ceil((score - prev) / 10)
          return Math.min(prev + diff, score)
        })
      }, 30)
      return () => clearInterval(interval)
    }
  }, [score, displayScore])

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-300 ${
        isCurrentPlayer
          ? 'bg-indigo-900/30 border-indigo-500 shadow-lg shadow-indigo-500/20'
          : isWinning
            ? 'bg-emerald-900/20 border-emerald-500 shadow-lg shadow-emerald-500/20'
            : 'bg-slate-800 border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-lg font-bold text-slate-50">{playerName}</p>
          {isCurrentPlayer && (
            <Badge variant="primary" size="sm">
              You
            </Badge>
          )}
        </div>
        {isWinning && (
          <Badge variant="success" size="sm">
            Winning
          </Badge>
        )}
      </div>

      {/* Score */}
      <div className="mb-4">
        <p className="text-sm text-slate-400 mb-1">Score</p>
        <p className="text-3xl font-extrabold text-indigo-400">
          ${(displayScore / 100).toFixed(2)}
        </p>
      </div>

      {/* Bid Status */}
      <div className="pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Bid Status</p>
        {bid === null ? (
          <p className="text-slate-400 italic">Waiting...</p>
        ) : bidRevealed ? (
          <p className="text-pink-400 font-semibold">
            Bid: ${(bid / 100).toFixed(2)}
          </p>
        ) : (
          <p className="text-slate-400 font-semibold">Bid Submitted</p>
        )}
      </div>
    </div>
  )
}

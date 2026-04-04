/**
 * Leaderboard component - Display ranked player standings
 * Features: ranking positions, color-coded medals, score diff
 * Used in: Lobby, Match results, Profile pages
 */

import React from 'react'
import { Badge } from '../ui'

interface LeaderboardEntry {
  rank: number
  playerId: string
  playerName: string
  score: number
  winRate: number
  matches: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  variant?: 'compact' | 'detailed'
}

const getMedalColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-500' // Gold
  if (rank === 2) return 'text-slate-400' // Silver
  if (rank === 3) return 'text-orange-600' // Bronze
  return 'text-slate-600'
}

const getMedalEmoji = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  currentUserId,
  variant = 'detailed',
}) => {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.playerId}
          className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
            currentUserId === entry.playerId
              ? 'bg-indigo-900/20 border-indigo-500'
              : 'bg-slate-800 border-slate-700 hover:border-slate-600'
          }`}
        >
          {/* Rank */}
          <div className={`flex-shrink-0 w-8 text-center font-bold ${getMedalColor(entry.rank)}`}>
            {getMedalEmoji(entry.rank) || `#${entry.rank}`}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-50 truncate">{entry.playerName}</p>
              {currentUserId === entry.playerId && (
                <Badge variant="primary" size="sm">
                  You
                </Badge>
              )}
            </div>
            {variant === 'detailed' && (
              <p className="text-sm text-slate-400">
                {entry.matches} matches • {(entry.winRate * 100).toFixed(1)}% win rate
              </p>
            )}
          </div>

          {/* Score */}
          <div className="flex-shrink-0 text-right">
            <p className="text-lg font-bold text-indigo-400">
              ${(entry.score / 100).toFixed(2)}
            </p>
            {variant === 'detailed' && (
              <p className="text-xs text-slate-400">Total Winnings</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

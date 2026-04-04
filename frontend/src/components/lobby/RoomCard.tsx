/**
 * RoomCard component - Display available room with quick join/view option
 * Used in: Lobby page listing
 */

import React from 'react'
import { Card, Button, Badge } from '../ui'

interface RoomCardProps {
  roomId: string
  creatorName: string
  entryFee: number
  playerCount: number
  maxPlayers?: number
  status: 'waiting' | 'active' | 'completed'
  onJoin?: () => void
  onView?: () => void
}

const statusColors = {
  waiting: 'warning',
  active: 'info',
  completed: 'success',
} as const

const statusLabels = {
  waiting: 'Waiting for Player',
  active: 'In Progress',
  completed: 'Completed',
} as const

export const RoomCard: React.FC<RoomCardProps> = ({
  roomId,
  creatorName,
  entryFee,
  playerCount,
  maxPlayers = 2,
  status,
  onJoin,
  onView,
}) => {
  const isFull = playerCount >= maxPlayers
  const canJoin = status === 'waiting' && !isFull

  return (
    <Card
      isClickable={Boolean(onView)}
      onClick={onView}
      className="hover:scale-105 transition-transform"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-400">Created by</p>
          <p className="text-lg font-semibold text-slate-50">{creatorName}</p>
        </div>
        <Badge variant={statusColors[status]} size="md">
          {statusLabels[status]}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4 py-4 border-y border-slate-700">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Entry Fee</span>
          <span className="font-bold text-indigo-400">
            ${(entryFee / 100).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Players</span>
          <span className="font-semibold">
            {playerCount}/{maxPlayers}
          </span>
        </div>
      </div>

      {/* Room ID */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Room ID</p>
        <p className="font-mono text-sm text-slate-300 break-all">{roomId.slice(0, 12)}...</p>
      </div>

      {/* Action */}
      {canJoin && onJoin && (
        <Button
          variant="primary"
          size="md"
          onClick={(e) => {
            e.stopPropagation()
            onJoin()
          }}
          className="w-full"
        >
          Join Room
        </Button>
      )}

      {isFull && (
        <div className="text-center py-2 bg-slate-700/50 rounded text-slate-400 text-sm">
          Room is full
        </div>
      )}

      {status !== 'waiting' && (
        <Button
          variant="secondary"
          size="md"
          onClick={(e) => {
            e.stopPropagation()
            onView?.()
          }}
          className="w-full"
        >
          Watch
        </Button>
      )}
    </Card>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BidSlider, ScoreCard, Timer, RevealAnimation, Leaderboard } from '@/components/game'
import { Card, Badge, Button } from '@/components/ui'
import { useMatch, useSocket } from '@/hooks/useSocket'
import { useMatchStore } from '@/stores/match.store'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'

export default function MatchPage() {
  const params = useParams()
  const matchId = params.id as string
  const user = useAuthStore((state) => state.user)
  
  // Initialize Socket.io connection and match state sync
  useSocket({
    onConnect: () => console.log('Connected to match:', matchId),
    onDisconnect: () => console.log('Disconnected from match'),
    onError: (error) => console.error('Match connection error:', error),
  })

  const { placeBid, joinMatch } = useMatch(matchId)
  const {
    currentPhase,
    players,
    currentHighBid,
    status,
    entryFee,
    winnings,
  } = useMatchStore()

  // Local state for UI
  const [yourBid, setYourBid] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Get current user's player data
  const currentPlayer = players.find((p) => p.playerId === user?.id)
  const opponent = players.find((p) => p.playerId !== user?.id)

  // Join match on mount if not already joined
  useEffect(() => {
    if (matchId && players.length === 0) {
      joinMatch()
    }
  }, [matchId, players.length, joinMatch])

  // Track when user has bid
  useEffect(() => {
    if (currentPlayer && currentPlayer.bid !== null && yourBid === null) {
      setYourBid(currentPlayer.bid)
    }
  }, [currentPlayer, yourBid])

  // Auto-show results after reveal phase completes
  useEffect(() => {
    if (status === 'completed') {
      const timer = setTimeout(() => setShowResults(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const handleBidSubmit = async (amount: number) => {
    setIsSubmitting(true)
    try {
      placeBid(amount)
      // Store will update automatically via Socket.io listener
      setYourBid(amount)
    } catch (error) {
      console.error('Failed to place bid:', error)
      // TODO: Show error toast to user
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine winner in current round
  const determineWinner = () => {
    if (!currentPlayer?.bid || !opponent?.bid) return null
    if (currentPlayer.bid > opponent.bid) return currentPlayer
    if (opponent.bid > currentPlayer.bid) return opponent
    return currentPlayer // Tie goes to current player
  }

  const winner = determineWinner()
  const isWinner = winner?.playerId === user?.id
  const timeLabel = 
    currentPhase.phase === 'bidding' ? '⏱ Time to Bid' : 
    currentPhase.phase === 'reveal' ? '👀 Reveal Time' :
    '✅ Match Complete'

  return (
    <div className="space-y-8">
      {/* Match Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Active Match</h1>
          <p className="text-slate-400 mt-2">
            Round {currentPhase.round} • Match ID: {matchId.slice(0, 8)}...
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              currentPhase.phase === 'bidding'
                ? 'warning'
                : currentPhase.phase === 'reveal'
                  ? 'info'
                  : 'success'
            }
            size="lg"
          >
            {currentPhase.phase === 'bidding' && '🎲 Bidding'}
            {currentPhase.phase === 'reveal' && '👀 Reveal'}
            {currentPhase.phase === 'completed' && '✅ Complete'}
          </Badge>
        </div>
      </div>

      {/* Timer */}
      <Card>
        <Timer
          durationMs={currentPhase.timeRemaining}
          onExpire={() => {
            // Phase transitions handled by server via Socket.io
            console.log('Phase expired, waiting for server transition')
          }}
          size="lg"
          label={timeLabel}
        />
      </Card>

      {/* Game Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Your Score */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
          {currentPlayer && (
            <ScoreCard
              playerName={currentPlayer.playerName}
              score={currentPlayer.score}
              bid={currentPlayer.bid}
              isCurrentPlayer
              bidRevealed={currentPlayer.bidRevealed}
            />
          )}
        </div>

        {/* Center: Bid Slider or Reveal */}
        <div>
          {currentPhase.phase === 'bidding' && !currentPlayer?.bid ? (
            <BidSlider
              minBid={Math.max(100, currentHighBid + 1)}
              maxBid={999999}
              currentHighBid={currentHighBid}
              onBidSubmit={handleBidSubmit}
              isLoading={isSubmitting}
              isDisabled={yourBid !== null}
            />
          ) : currentPhase.phase === 'bidding' && currentPlayer?.bid ? (
            <Card title="Bid Placed">
              <div className="text-center py-6">
                <p className="text-4xl font-bold text-indigo-400 mb-2">
                  ${(currentPlayer.bid / 100).toFixed(2)}
                </p>
                <p className="text-slate-400">Waiting for reveal phase...</p>
              </div>
            </Card>
          ) : (
            <Card title="Bid Reveal">
              {currentPlayer && (
                <RevealAnimation
                  isRevealed={currentPlayer.bidRevealed}
                  revealedValue={currentPlayer.bid ? `$${(currentPlayer.bid / 100).toFixed(2)}` : '$0.00'}
                  revealedLabel="Your Bid"
                />
              )}
            </Card>
          )}
        </div>

        {/* Right: Opponent Score */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Opponent</h3>
          {opponent && (
            <ScoreCard
              playerName={opponent.playerName}
              score={opponent.score}
              bid={
                currentPhase.phase === 'reveal' || opponent.bidRevealed
                  ? opponent.bid
                  : null
              }
              isWinning={opponent.playerId === winner?.playerId && currentPhase.phase === 'completed'}
              bidRevealed={opponent.bidRevealed}
            />
          )}
        </div>
      </div>

      {/* Match Leaderboard */}
      <Card title="Round Standings">
        <Leaderboard
          entries={players.map((p, idx) => ({
            rank: idx + 1,
            playerId: p.playerId,
            playerName: p.playerName,
            score: p.score,
            winRate: 0.5,
            matches: currentPhase.round,
          }))}
          currentUserId={user?.id}
          variant="compact"
        />
      </Card>

      {/* Match Results */}
      {status === 'completed' && showResults && (
        <Card title="Match Complete" isHighlighted>
          <div className="text-center py-8">
            <p className="text-3xl font-bold mb-4">
              {isWinner ? '🎉 You Won!' : '😔 Better Luck Next Time'}
            </p>
            {isWinner && (
              <p className="text-2xl text-emerald-400 font-bold mb-6">
                +${(winnings / 100).toFixed(2)}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Link href="/lobby">
                <Button variant="primary">Return to Lobby</Button>
              </Link>
              <button
                onClick={() => {
                  // TODO: Implement play again - create new match
                  console.log('Play again clicked')
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

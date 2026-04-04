/**
 * Match Store - Real-time match state management
 * Synced with Socket.io events from backend
 */

import { create } from 'zustand'

export interface MatchPhase {
  phase: 'bidding' | 'reveal' | 'completed'
  round: number
  timeRemaining: number
}

export interface PlayerInMatch {
  playerId: string
  playerName: string
  bid: number | null
  bidRevealed: boolean
  score: number
}

interface MatchStoreState {
  matchId: string | null
  status: 'waiting' | 'active' | 'completed'
  currentPhase: MatchPhase
  players: PlayerInMatch[]
  currentHighBid: number
  entryFee: number
  winnings: number

  // Actions
  initializeMatch: (data: {
    matchId: string
    entryFee: number
    players: PlayerInMatch[]
  }) => void
  updatePhase: (phase: MatchPhase) => void
  updateBid: (playerId: string, bid: number) => void
  revealBid: (playerId: string) => void
  updateScore: (playerId: string, score: number) => void
  setCurrentHighBid: (amount: number) => void
  completeMatch: (winnings: number) => void
  reset: () => void
}

export const useMatchStore = create<MatchStoreState>((set) => ({
  // Initial state
  matchId: null,
  status: 'waiting',
  currentPhase: {
    phase: 'bidding',
    round: 1,
    timeRemaining: 30000,
  },
  players: [],
  currentHighBid: 0,
  entryFee: 0,
  winnings: 0,

  // Actions
  initializeMatch: (data) =>
    set({
      matchId: data.matchId,
      entryFee: data.entryFee,
      players: data.players,
      status: 'active',
    }),

  updatePhase: (phase) =>
    set({
      currentPhase: phase,
    }),

  updateBid: (playerId, bid) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.playerId === playerId ? { ...p, bid } : p,
      ),
      currentHighBid: Math.max(state.currentHighBid, bid),
    })),

  revealBid: (playerId) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.playerId === playerId ? { ...p, bidRevealed: true } : p,
      ),
    })),

  updateScore: (playerId, score) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.playerId === playerId ? { ...p, score } : p,
      ),
    })),

  setCurrentHighBid: (amount) =>
    set({
      currentHighBid: amount,
    }),

  completeMatch: (winnings) =>
    set({
      status: 'completed',
      winnings,
    }),

  reset: () =>
    set({
      matchId: null,
      status: 'waiting',
      currentPhase: {
        phase: 'bidding',
        round: 1,
        timeRemaining: 30000,
      },
      players: [],
      currentHighBid: 0,
      entryFee: 0,
      winnings: 0,
    }),
}))

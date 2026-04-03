/**
 * Match module - Types and interfaces
 * Real-time competitive bidding with server-authoritative validation
 */

// ============================================================================
// Match State & Status
// ============================================================================

export type MatchStatus = 'waiting' | 'active' | 'completed' | 'cancelled'

export interface Match {
  id: string
  player1Id: string
  player2Id: string | null
  winnerId: string | null
  entryFee: number // in cents
  status: MatchStatus
  roomToken: string | null
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
}

// ============================================================================
// Room & Player State
// ============================================================================

export interface PlayerState {
  userId: string
  username: string
  currentBid: number // latest bid in cents
  bidCount: number // total bids placed
  lastBidAt: Date | null
  isActive: boolean // still connected to socket
}

export interface MatchRoom {
  matchId: string
  player1: PlayerState
  player2: PlayerState | null
  entryFee: number
  status: MatchStatus
  currentHighBid: number
  currentBidder: string | null
  players: Map<string, PlayerState> // userId -> PlayerState
  startTime: Date | null
  endTime: Date | null
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

export interface CreateMatchInput {
  entryFee: number // in cents, must be > 0
}

export interface CreateMatchRequest {
  entryFee: number
  gameType?: string
}

export interface MatchResponse {
  id: string
  player1Id: string
  player2Id: string | null
  status: MatchStatus
  entryFee: number
  roomToken: string | null
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
}

export interface JoinMatchRequest {
  matchId: string
}

export interface MatchStatusResponse {
  id: string
  status: MatchStatus
  player1: PlayerInfoResponse
  player2: PlayerInfoResponse | null
  currentHighBid: number
  currentBidder: string | null
  entryFee: number
  startedAt: Date | null
  updatedAt: Date
}

export interface PlayerInfoResponse {
  userId: string
  username: string
  currentBid: number
  bidCount: number
  lastBidAt: Date | null
  isActive: boolean
}

export interface MatchListResponse {
  matches: MatchResponse[]
  total: number
  page: number
  limit: number
}

// ============================================================================
// Real-time Events (Socket.io)
// ============================================================================

export interface PlaceBidInput {
  matchId: string
  amount: number
}

export interface BidEvent {
  matchId: string
  userId: string
  amount: number // in cents
  timestamp: Date
  sequenceNumber: number // for ordering in distributed system
}

export interface MatchStartedEvent {
  matchId: string
  player1Id: string
  player2Id: string
  startTime: Date
  entryFee: number
}

export interface MatchCompletedEvent {
  matchId: string
  winnerId: string
  finalBid: number
  timestamp: Date
}

export interface PlayerJoinedEvent {
  matchId: string
  userId: string
  username: string
  timestamp: Date
}

export interface PlayerLeftEvent {
  matchId: string
  userId: string
  timestamp: Date
  reason: 'disconnected' | 'cancelled' | 'completed'
}

export interface BidUpdateEvent {
  matchId: string
  currentHighBid: number
  currentBidder: string
  bidderUsername: string
  totalBids: number
  timestamp: Date
}

// ============================================================================
// Bid Validation & Conflict Resolution
// ============================================================================

export interface BidValidationResult {
  isValid: boolean
  error?: string
  reason?: 'insufficient_balance' | 'invalid_amount' | 'player_not_active' | 'match_ended' | 'duplicate_bid'
}

export interface BidConflict {
  type: 'concurrent_bid' | 'network_delay' | 'clock_skew'
  serverBid: BidEvent
  clientBid: BidEvent
  resolution: 'server_wins' | 'client_wins'
}

// ============================================================================
// Escrow & Settlement
// ============================================================================

export interface EscrowHold {
  id: string
  matchId: string
  userId: string
  amount: number
  released: boolean
  createdAt: Date
  releasedAt: Date | null
}

export interface MatchSettlement {
  matchId: string
  winnerId: string
  loserIds: string[]
  entryFee: number
  platformFeePercentage: number
  payouts: {
    userId: string
    amount: number
  }[]
}

// ============================================================================
// Internal State Management
// ============================================================================

export interface RoomState {
  matchId: string
  roomKey: string
  players: Record<string, PlayerState>
  status: MatchStatus
  bids: BidEvent[]
  currentHighBid: number
  currentBidder: string | null
  lastUpdateAt: number
}

export interface BidLog {
  matchId: string
  bids: Array<{
    userId: string
    username: string
    amount: number
    timestamp: Date
    sequence: number
  }>
}

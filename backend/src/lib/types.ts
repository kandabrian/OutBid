/**
 * Shared types used across modules
 */

export interface JWTPayload {
  userId: string
  username: string
  email?: string
  isGuest: boolean
  iat: number
  exp: number
}

export interface RequestContext {
  userId: string
  requestId: string
  isGuest: boolean
}

export enum MatchStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum BidPhase {
  SUBMISSION = 'submission',
  REVEAL = 'reveal',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  MPESA = 'mpesa',
  CRYPTO = 'crypto',
}

export enum KYCTier {
  UNVERIFIED = 'unverified',
  TIER_1 = 'tier_1', // Basic KYC, $0-1000/day
  TIER_2 = 'tier_2', // Full KYC, $1000-10000/day
  TIER_3 = 'tier_3', // Business KYC, unlimited
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

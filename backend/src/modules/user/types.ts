/**
 * User module - Profile and stats management
 */

export interface UserProfile {
  id: string
  email?: string
  username: string
  avatar?: string
  bio?: string
  createdAt: Date
}

export interface PlayerStats {
  userId: string
  matchesPlayed: number
  matchesWon: number
  totalEarnings: number
  averageBid: number
  lastMatch?: Date
}

export interface KYCInfo {
  userId: string
  tier: 'unverified' | 'tier_1' | 'tier_2' | 'tier_3'
  verified: boolean
  documents?: {
    idVerification?: {
      status: 'pending' | 'approved' | 'rejected'
      uploadedAt: Date
    }
    proofOfAddress?: {
      status: 'pending' | 'approved' | 'rejected'
      uploadedAt: Date
    }
  }
}

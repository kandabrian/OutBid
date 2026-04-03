export type MatchStatus = 'waiting' | 'active' | 'completed' | 'abandoned'

export interface Match {
  id: string
  entryFee: number
  status: MatchStatus
  player1Id: string
  player2Id?: string
}

export interface BidResult {
  itemIndex: number
  player1Bid: number
  player2Bid: number
  winnerId: string
}

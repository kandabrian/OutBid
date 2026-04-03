/**
 * Wallet module types
 */

export interface WalletBalance {
  userId: string
  balance: number // in cents
  onHold: number // escrow holds, in cents
  available: number // balance - onHold
}

export interface Transaction {
  id: string
  userId: string
  amount: number // cents
  type: string // deposit, withdrawal, match_win, match_loss, refund
  description?: string
  createdAt: Date
}

export interface DepositRequest {
  amount: number
  method: string
  idempotencyKey: string
}

export interface WithdrawalRequest {
  amount: number
  method: string
  idempotencyKey: string
}

/**
 * Wallet Store - Balance and transaction state management
 * Synced with Socket.io events for real-time balance updates
 */

import { create } from 'zustand'

export type TransactionType = 'deposit' | 'withdrawal' | 'win' | 'loss' | 'fee'
export type TransactionStatus = 'completed' | 'pending' | 'failed'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number // in cents
  status: TransactionStatus
  description: string
  timestamp: Date
  provider?: 'stripe' | 'm-pesa' | 'crypto' // for deposits
}

interface WalletStoreState {
  availableBalance: number // in cents
  escrowHold: number // in cents
  totalBalance: number // in cents
  transactions: Transaction[]
  kycTier: 'unverified' | 'tier-1' | 'tier-2' | 'tier-3'
  dailyLimitRemaining: number // in cents

  // Actions
  updateBalance: (available: number, escrow: number) => void
  addTransaction: (transaction: Transaction) => void
  deposit: (amount: number, provider: 'stripe' | 'm-pesa' | 'crypto') => void
  withdraw: (amount: number, destination: string) => void
  recordWin: (amount: number, matchId: string) => void
  recordLoss: (amount: number, matchId: string) => void
  recordFee: (amount: number, description: string) => void
  setKycTier: (tier: 'unverified' | 'tier-1' | 'tier-2' | 'tier-3') => void
  setDailyLimitRemaining: (amount: number) => void
}

export const useWalletStore = create<WalletStoreState>((set, get) => ({
  // Initial state
  availableBalance: 0,
  escrowHold: 0,
  totalBalance: 0,
  transactions: [],
  kycTier: 'unverified',
  dailyLimitRemaining: 0,

  // Actions
  updateBalance: (available, escrow) =>
    set({
      availableBalance: available,
      escrowHold: escrow,
      totalBalance: available + escrow,
    }),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),

  deposit: (amount, provider) => {
    const transaction: Transaction = {
      id: `dep_${Date.now()}`,
      type: 'deposit',
      amount,
      status: 'completed',
      description: `Deposit via ${provider}`,
      timestamp: new Date(),
      provider,
    }
    get().addTransaction(transaction)
    set((state) => ({
      availableBalance: state.availableBalance + amount,
      totalBalance: state.totalBalance + amount,
    }))
  },

  withdraw: (amount, destination) => {
    const transaction: Transaction = {
      id: `wdl_${Date.now()}`,
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: `Withdrawal to ${destination}`,
      timestamp: new Date(),
    }
    get().addTransaction(transaction)
    set((state) => ({
      availableBalance: state.availableBalance - amount,
      totalBalance: state.totalBalance - amount,
    }))
  },

  recordWin: (amount, matchId) => {
    const transaction: Transaction = {
      id: `win_${matchId}`,
      type: 'win',
      amount,
      status: 'completed',
      description: `Won match ${matchId}`,
      timestamp: new Date(),
    }
    get().addTransaction(transaction)
    set((state) => ({
      availableBalance: state.availableBalance + amount,
      totalBalance: state.totalBalance + amount,
    }))
  },

  recordLoss: (amount, matchId) => {
    const transaction: Transaction = {
      id: `loss_${matchId}`,
      type: 'loss',
      amount,
      status: 'completed',
      description: `Lost match ${matchId}`,
      timestamp: new Date(),
    }
    get().addTransaction(transaction)
  },

  recordFee: (amount, description) => {
    const transaction: Transaction = {
      id: `fee_${Date.now()}`,
      type: 'fee',
      amount,
      status: 'completed',
      description,
      timestamp: new Date(),
    }
    get().addTransaction(transaction)
    set((state) => ({
      availableBalance: state.availableBalance - amount,
      totalBalance: state.totalBalance - amount,
    }))
  },

  setKycTier: (tier) =>
    set({
      kycTier: tier,
    }),

  setDailyLimitRemaining: (amount) =>
    set({
      dailyLimitRemaining: amount,
    }),
}))

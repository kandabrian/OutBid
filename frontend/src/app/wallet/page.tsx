'use client'

import React, { useState } from 'react'
import { WalletBalance, DepositForm, TransactionHistory } from '@/components/wallet'
import { Card, Button } from '@/components/ui'
import { Modal } from '@/components/ui'

// Mock data
const mockTransactions = [
  {
    id: 'tx-001',
    type: 'deposit' as const,
    amount: 10000,
    provider: 'stripe',
    status: 'completed' as const,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    description: 'Stripe deposit',
  },
  {
    id: 'tx-002',
    type: 'win' as const,
    amount: 2500,
    status: 'completed' as const,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    description: 'Match win vs ProBidder',
  },
  {
    id: 'tx-003',
    type: 'loss' as const,
    amount: -1000,
    status: 'completed' as const,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    description: 'Match loss vs StrategyKing',
  },
  {
    id: 'tx-004',
    type: 'fee' as const,
    amount: -200,
    status: 'completed' as const,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    description: 'Platform fee (2%)',
  },
  {
    id: 'tx-005',
    type: 'deposit' as const,
    amount: 5000,
    provider: 'mpesa',
    status: 'completed' as const,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    description: 'M-Pesa deposit',
  },
]

export default function WalletPage() {
  const [balance, setBalance] = useState(25300) // $253.00
  const [escrowHold, setEscrowHold] = useState(5000) // $50.00
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const handleDeposit = async (amount: number, provider: string) => {
    setIsDepositing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log(`Deposit ${(amount / 100).toFixed(2)} via ${provider}`)
      setBalance(balance + amount)
      setShowDepositModal(false)
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Math.round(parseFloat(withdrawAmount) * 100)
    if (amount > balance || amount <= 0) {
      alert('Invalid withdrawal amount')
      return
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setBalance(balance - amount)
      setShowWithdrawModal(false)
      setWithdrawAmount('')
    } catch (err) {
      alert('Withdrawal failed')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Wallet</h1>
          <p className="text-slate-400 mt-2">Manage your balance, deposit, and withdraw funds</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all"
          >
            Deposit
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WalletBalance
          availableBalance={balance}
          escrowHold={escrowHold}
          totalBalance={balance + escrowHold}
        />

        {/* Quick Stats */}
        <Card title="Wallet Stats">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Deposited</p>
              <p className="text-2xl font-bold text-indigo-400">$150.00</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Withdrawn</p>
              <p className="text-2xl font-bold text-red-400">$75.00</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Winnings</p>
              <p className="text-2xl font-bold text-emerald-400">$178.00</p>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-1">KYC Tier</p>
              <p className="text-lg font-semibold text-slate-50">Tier 1 - Basic</p>
              <p className="text-xs text-slate-500 mt-1">Daily limit: $1,000 • Withdraw limit: $100</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <TransactionHistory transactions={mockTransactions} />

      {/* Deposit Modal */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        size="md"
      >
        <DepositForm onSubmit={handleDeposit} isLoading={isDepositing} />
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Funds"
        description="Transfer money back to your bank or wallet"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => setShowWithdrawModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleWithdraw}
              className="flex-1"
            >
              Withdraw
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-100 mb-2">
              Withdrawal Amount (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-50 rounded-lg px-4 py-2.5 text-base outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-2">
              Available: ${(balance / 100).toFixed(2)}
            </p>
          </div>

          <div className="bg-amber-900/20 border border-amber-700 p-3 rounded-lg">
            <p className="text-sm text-amber-300">
              ⚠️ Withdrawals may take 1-3 business days to process
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-100 mb-2">
              Destination
            </label>
            <select className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-50 rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Bank Account (Pending setup)</option>
              <option>M-Pesa Account</option>
              <option>Crypto Wallet</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

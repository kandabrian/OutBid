'use client'

import React, { useState, useEffect } from 'react'
import { WalletBalance, DepositForm, TransactionHistory } from '@/components/wallet'
import { authHeaders } from '@/stores/auth.store'
import { Card, Button, Modal } from '@/components/ui'

type TransactionType = 'deposit' | 'withdrawal' | 'win' | 'loss' | 'fee'

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  provider?: string
  status: 'completed' | 'pending' | 'failed'
  timestamp: Date
  description: string
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [escrowHold, setEscrowHold] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [isLoadingTx, setIsLoadingTx] = useState(true)

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositError, setDepositError] = useState('')

  // M-Pesa phone number — collected before opening deposit modal
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [pendingDeposit, setPendingDeposit] = useState<{ amount: number; provider: string } | null>(null)

  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')

  // ── Fetch balance ──────────────────────────────────────────────────────────
  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/v1/wallet/balance', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch balance')
      const data = await res.json()
      setBalance(data.balance)
      setEscrowHold(data.onHold ?? 0)
    } catch (err) {
      console.error('Balance fetch error:', err)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  // ── Fetch transactions ─────────────────────────────────────────────────────
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/v1/wallet/transactions?limit=50', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to fetch transactions')
      const data = await res.json()

      // Normalise ledger entries into the Transaction shape
      const mapped: Transaction[] = (data.transactions ?? []).map((tx: any) => ({
        id: tx.id,
        type: mapType(tx.type),
        amount: tx.amount,
        provider: tx.provider,
        status: 'completed',
        timestamp: new Date(tx.createdAt),
        description: tx.description || tx.type,
      }))
      setTransactions(mapped)
    } catch (err) {
      console.error('Transaction fetch error:', err)
    } finally {
      setIsLoadingTx(false)
    }
  }

  useEffect(() => {
    fetchBalance()
    fetchTransactions()

    // Handle redirect back from NOWPayments
    const params = new URLSearchParams(window.location.search)
    const depositStatus = params.get('deposit')
    if (depositStatus === 'success') {
      alert('Crypto payment received! Your wallet will be credited once confirmed on the blockchain.')
      window.history.replaceState({}, '', '/wallet')
    } else if (depositStatus === 'cancelled') {
      alert('Crypto payment was cancelled.')
      window.history.replaceState({}, '', '/wallet')
    }
  }, [])

  // ── Deposit ────────────────────────────────────────────────────────────────
  const handleDeposit = async (amount: number, provider: string) => {
    // M-Pesa needs a phone number — collect it first
    if (provider === 'mpesa' && !mpesaPhone) {
      setPendingDeposit({ amount, provider })
      setShowPhoneModal(true)
      return
    }

    setIsDepositing(true)
    setDepositError('')

    try {
      const idempotencyKey = crypto.randomUUID()

      if (provider === 'mpesa') {
        // Call the M-Pesa-specific endpoint — no auth required
        const res = await fetch('/api/v1/payment/mpesa/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, phoneNumber: mpesaPhone }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || 'M-Pesa initiation failed')

        // STK push sent — close modal, wallet credits on callback
        setShowDepositModal(false)
        setMpesaPhone('')
        alert('M-Pesa prompt sent to your phone. Enter your PIN to complete the deposit.')
      } else if (provider === 'crypto') {
        // Redirect to NOWPayments hosted page
        const res = await fetch('/api/v1/payment/crypto/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || 'Crypto deposit failed')

        // Redirect user to NOWPayments hosted checkout
        window.location.href = data.paymentUrl
      } else {
        // Stripe goes through wallet deposit route
        const res = await fetch('/api/v1/wallet/deposit', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ amount, method: provider, idempotencyKey }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || 'Deposit failed')

        setBalance((b) => b + amount)
        setShowDepositModal(false)
        await fetchTransactions()
      }
    } catch (err) {
      setDepositError(err instanceof Error ? err.message : 'Deposit failed')
      throw err // let DepositForm catch and display it
    } finally {
      setIsDepositing(false)
    }
  }

  // Called after user enters their phone number in the phone modal
  const handlePhoneSubmit = async () => {
    if (!pendingDeposit) return
    setShowPhoneModal(false)
    await handleDeposit(pendingDeposit.amount, pendingDeposit.provider)
    setPendingDeposit(null)
  }

  // ── Withdraw ───────────────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    setWithdrawError('')
    const amount = Math.round(parseFloat(withdrawAmount) * 100)

    if (!amount || amount <= 0) {
      setWithdrawError('Enter a valid amount')
      return
    }
    if (amount > balance) {
      setWithdrawError('Insufficient balance')
      return
    }

    setIsWithdrawing(true)
    try {
      const res = await fetch('/api/v1/wallet/withdraw', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          amount,
          method: 'mpesa',
          idempotencyKey: crypto.randomUUID(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Withdrawal failed')

      setBalance((b) => b - amount)
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      await fetchTransactions()
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Withdrawal failed')
    } finally {
      setIsWithdrawing(false)
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
              <p className="text-2xl font-bold text-indigo-400">
                ${(transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0) / 100).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Winnings</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${(transactions.filter(t => t.type === 'win').reduce((s, t) => s + t.amount, 0) / 100).toFixed(2)}
              </p>
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
      <TransactionHistory transactions={transactions} isLoading={isLoadingTx} />

      {/* Deposit Modal */}
      <Modal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} size="md">
        <DepositForm onSubmit={handleDeposit} isLoading={isDepositing} />
      </Modal>

      {/* M-Pesa Phone Number Modal */}
      <Modal
        isOpen={showPhoneModal}
        onClose={() => { setShowPhoneModal(false); setPendingDeposit(null) }}
        title="Enter M-Pesa Number"
        description="We'll send an STK push to this number"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => { setShowPhoneModal(false); setPendingDeposit(null) }} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePhoneSubmit} className="flex-1" disabled={!mpesaPhone}>
              Send Prompt
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-100 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={mpesaPhone}
            onChange={(e) => setMpesaPhone(e.target.value)}
            placeholder="0712 345 678"
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-50 rounded-lg px-4 py-2.5 text-base outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          <p className="text-xs text-slate-400">Format: 0712345678 or +254712345678</p>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Funds"
        description="Transfer money back to your bank or wallet"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => setShowWithdrawModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleWithdraw} isLoading={isWithdrawing} className="flex-1">
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
            {withdrawError && <p className="text-xs text-red-400 mt-1">{withdrawError}</p>}
          </div>

          <div className="bg-amber-900/20 border border-amber-700 p-3 rounded-lg">
            <p className="text-sm text-amber-300">
              ⚠️ Withdrawals may take 1-3 business days to process
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-100 mb-2">Destination</label>
            <select className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-50 rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500">
              <option>M-Pesa Account</option>
              <option>Bank Account</option>
              <option>Crypto Wallet</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Map wallet ledger type strings to TransactionType
function mapType(type: string): TransactionType {
  if (type === 'deposit') return 'deposit'
  if (type === 'withdrawal') return 'withdrawal'
  if (type === 'match_win' || type === 'win') return 'win'
  if (type === 'match_loss' || type === 'loss') return 'loss'
  if (type === 'platform_fee' || type === 'fee') return 'fee'
  return 'fee'
}
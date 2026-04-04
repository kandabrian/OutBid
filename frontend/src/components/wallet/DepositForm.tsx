/**
 * DepositForm component - Deposit funds to wallet
 * Features: Multiple payment providers (Stripe, M-Pesa, Crypto)
 */

import React, { useState } from 'react'
import { Button, Input, Select, Card, Badge } from '../ui'

type PaymentProvider = 'stripe' | 'mpesa' | 'crypto'

interface DepositFormProps {
  onSubmit: (amount: number, provider: PaymentProvider) => void | Promise<void>
  isLoading?: boolean
  minDeposit?: number
  maxDeposit?: number
}

export const DepositForm: React.FC<DepositFormProps> = ({
  onSubmit,
  isLoading = false,
  minDeposit = 100, // $1.00
  maxDeposit = 9999999, // $99,999.99
}) => {
  const [amount, setAmount] = useState<string>('50.00')
  const [provider, setProvider] = useState<PaymentProvider>('stripe')
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amountCents = Math.round(parseFloat(amount) * 100)

    if (isNaN(amountCents) || amountCents < minDeposit || amountCents > maxDeposit) {
      setError(
        `Deposit must be between $${(minDeposit / 100).toFixed(2)} and $${(maxDeposit / 100).toFixed(2)}`,
      )
      return
    }

    try {
      await onSubmit(amountCents, provider)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process deposit')
    }
  }

  const providerOptions = [
    { value: 'stripe', label: '💳 Credit/Debit Card (Stripe)' },
    { value: 'mpesa', label: '📱 M-Pesa (Mobile Money)' },
    { value: 'crypto', label: '⛓️ Cryptocurrency' },
  ]

  return (
    <Card title="Deposit Funds" description="Add money to your wallet">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount */}
        <Input
          label="Amount (USD)"
          type="number"
          step="0.01"
          min={minDeposit / 100}
          max={maxDeposit / 100}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="50.00"
          error={error}
          disabled={isLoading}
        />

        {/* Payment Provider */}
        <Select
          label="Payment Method"
          value={provider}
          onChange={(e) => setProvider(e.target.value as PaymentProvider)}
          options={providerOptions}
          disabled={isLoading}
        />

        {/* Provider Info */}
        {provider === 'stripe' && (
          <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-300">
              ✓ Instant processing • Supported worldwide • USD only
            </p>
          </div>
        )}

        {provider === 'mpesa' && (
          <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-sm text-green-300">
              ✓ M-Pesa payments • East Africa • KES currency
            </p>
          </div>
        )}

        {provider === 'crypto' && (
          <div className="p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
            <p className="text-sm text-purple-300">
              ✓ Ethereum, Polygon • Self-custody • Instant blockchain confirmation
            </p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : `Deposit $${amount}`}
        </Button>

        <p className="text-xs text-slate-400 text-center">
          Safe & Secure • Your funds are protected in escrow
        </p>
      </form>
    </Card>
  )
}

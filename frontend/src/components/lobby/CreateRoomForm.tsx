/**
 * CreateRoomForm component - Form to create a new room/match
 * Features: entry fee input with validation, submit action
 */

import React, { useState } from 'react'
import { Button, Input, Card } from '../ui'

interface CreateRoomFormProps {
  minEntryFee?: number
  maxEntryFee?: number
  onSubmit: (entryFee: number) => void | Promise<void>
  isLoading?: boolean
}

export const CreateRoomForm: React.FC<CreateRoomFormProps> = ({
  minEntryFee = 100, // $1.00
  maxEntryFee = 9999999, // $99,999.99
  onSubmit,
  isLoading = false,
}) => {
  const [entryFee, setEntryFee] = useState<string>('10.00') // Default $10
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const fee = Math.round(parseFloat(entryFee) * 100)

    if (isNaN(fee) || fee < minEntryFee || fee > maxEntryFee) {
      setError(
        `Entry fee must be between $${(minEntryFee / 100).toFixed(2)} and $${(maxEntryFee / 100).toFixed(2)}`,
      )
      return
    }

    try {
      await onSubmit(fee)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    }
  }

  return (
    <Card title="Create New Room" description="Set your entry fee and challenge another player">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Entry Fee (USD)"
            type="number"
            step="0.01"
            min={minEntryFee / 100}
            max={maxEntryFee / 100}
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="10.00"
            error={error}
            disabled={isLoading}
          />
          <p className="text-xs text-slate-400 mt-2">
            ℹ️ The entry fee will be held in escrow until the match completes
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          Create Room
        </Button>
      </form>
    </Card>
  )
}

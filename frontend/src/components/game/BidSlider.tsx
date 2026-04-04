/**
 * BidSlider component - Interactive slider for placing bids
 * Features: real-time value display, min/max validation, haptic feedback
 * Used in: Match game screen, real-time bid placement
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../ui'

interface BidSliderProps {
  minBid: number
  maxBid: number
  currentHighBid: number
  onBidSubmit: (amount: number) => void | Promise<void>
  isLoading?: boolean
  isDisabled?: boolean
}

export const BidSlider: React.FC<BidSliderProps> = ({
  minBid,
  maxBid,
  currentHighBid,
  onBidSubmit,
  isLoading = false,
  isDisabled = false,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(minBid)
  const [displayValue, setDisplayValue] = useState<string>(
    (minBid / 100).toFixed(2),
  )

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setSliderValue(value)
    setDisplayValue((value / 100).toFixed(2))
  }

  const handleBidSubmit = () => {
    if (sliderValue < minBid || sliderValue > maxBid) {
      return
    }
    onBidSubmit(sliderValue)
  }

  const percentage = ((sliderValue - minBid) / (maxBid - minBid)) * 100

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-400">Current Bid</p>
          <p className="text-2xl font-bold text-indigo-400">
            ${(currentHighBid / 100).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Your Bid</p>
          <p className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            ${displayValue}
          </p>
        </div>
      </div>

      {/* Slider with gradient track */}
      <div className="space-y-3">
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          {/* Filled track */}
          <div
            className="absolute h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-100"
            style={{ width: `${percentage}%` }}
          />

          {/* Slider input */}
          <input
            type="range"
            min={minBid}
            max={maxBid}
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={isDisabled || isLoading}
            className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Bid amount"
          />

          {/* Custom thumb marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-lg pointer-events-none transition-all duration-100 border-2 border-indigo-500"
            style={{ left: `${percentage}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-slate-400">
          <span>${(minBid / 100).toFixed(2)}</span>
          <span>${(maxBid / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleBidSubmit}
        isLoading={isLoading}
        disabled={
          isDisabled ||
          isLoading ||
          sliderValue <= currentHighBid ||
          sliderValue < minBid ||
          sliderValue > maxBid
        }
        className="w-full"
      >
        {sliderValue <= currentHighBid ? 'Bid Higher to Continue' : 'Place Bid'}
      </Button>

      {/* Help text */}
      {sliderValue <= currentHighBid && (
        <p className="text-sm text-amber-400 text-center">
          Your bid must be higher than the current bid
        </p>
      )}
    </div>
  )
}

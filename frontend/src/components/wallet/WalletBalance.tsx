/**
 * WalletBalance component - Display user's wallet balance and escrow holds
 */

import React from 'react'
import { Card, Badge } from '../ui'

interface WalletBalanceProps {
  availableBalance: number
  escrowHold?: number
  totalBalance?: number
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({
  availableBalance,
  escrowHold = 0,
  totalBalance = availableBalance + escrowHold,
}) => {
  return (
    <Card>
      <div className="space-y-4">
        {/* Available Balance (Primary) */}
        <div>
          <p className="text-sm text-slate-400 mb-1">Available Balance</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-extrabold text-indigo-400">
              ${(availableBalance / 100).toFixed(2)}
            </p>
            {availableBalance < 100 && (
              <Badge variant="warning" size="sm">
                Low Balance
              </Badge>
            )}
          </div>
        </div>

        {/* Escrow Hold */}
        {escrowHold > 0 && (
          <div className="pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-1">In Escrow (Active Matches)</p>
            <p className="text-lg font-semibold text-amber-400">
              ${(escrowHold / 100).toFixed(2)}
            </p>
          </div>
        )}

        {/* Total Balance */}
        <div className="pt-4 border-t border-slate-700 bg-slate-900/50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Balance</p>
          <p className="text-2xl font-bold text-slate-300">
            ${(totalBalance / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  )
}

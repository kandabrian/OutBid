/**
 * TransactionHistory component - Display wallet transactions
 * Features: Pagination, filtering, sorting
 */

import React, { useState } from 'react'
import { Card, Badge } from '../ui'

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

interface TransactionHistoryProps {
  transactions: Transaction[]
  isLoading?: boolean
}

const getTransactionTypeColor = (type: TransactionType) => {
  switch (type) {
    case 'deposit':
      return 'primary'
    case 'withdrawal':
      return 'warning'
    case 'win':
      return 'success'
    case 'loss':
      return 'danger'
    case 'fee':
      return 'info'
  }
}

const getTransactionTypeLabel = (type: TransactionType) => {
  switch (type) {
    case 'deposit':
      return '💰 Deposit'
    case 'withdrawal':
      return '💸 Withdrawal'
    case 'win':
      return '🎉 Win'
    case 'loss':
      return '❌ Loss'
    case 'fee':
      return '⚙️ Fee'
  }
}

const getAmountColor = (type: TransactionType, amount: number) => {
  if (type === 'win' || type === 'deposit') return 'text-emerald-400'
  if (type === 'loss' || type === 'withdrawal' || type === 'fee') return 'text-red-400'
  return 'text-slate-300'
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading = false,
}) => {
  const [page, setPage] = useState(0)
  const itemsPerPage = 10
  const paginatedTx = transactions.slice(page * itemsPerPage, (page + 1) * itemsPerPage)

  return (
    <Card title="Transaction History">
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-slate-400">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No transactions yet</p>
        </div>
      ) : (
        <>
          {/* Transaction List */}
          <div className="space-y-3">
            {paginatedTx.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-all"
              >
                {/* Left: Type & Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getTransactionTypeColor(tx.type)} size="sm">
                      {getTransactionTypeLabel(tx.type)}
                    </Badge>
                    {tx.status === 'pending' && (
                      <Badge variant="warning" size="sm">
                        Pending
                      </Badge>
                    )}
                    {tx.status === 'failed' && (
                      <Badge variant="danger" size="sm">
                        Failed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {tx.timestamp.toLocaleDateString()} at{' '}
                    {tx.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Right: Amount */}
                <div className="flex-shrink-0 text-right ml-4">
                  <p className={`font-semibold ${getAmountColor(tx.type, tx.amount)}`}>
                    {tx.type === 'win' || tx.type === 'deposit' ? '+' : '-'}$
                    {(Math.abs(tx.amount) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {transactions.length > itemsPerPage && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-700 pt-4">
              <p className="text-sm text-slate-400">
                Page {page + 1} of {Math.ceil(transactions.length / itemsPerPage)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage(Math.min(Math.ceil(transactions.length / itemsPerPage) - 1, page + 1))
                  }
                  disabled={page >= Math.ceil(transactions.length / itemsPerPage) - 1}
                  className="px-3 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

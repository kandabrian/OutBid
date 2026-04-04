'use client'

import React, { useState } from 'react'
import { Card, Badge } from '@/components/ui'
import { Leaderboard } from '@/components/game'

const mockUserStats = {
  username: 'YourUsername',
  joinDate: new Date('2026-01-15'),
  totalMatches: 42,
  wins: 28,
  losses: 14,
  winRate: 0.667,
  totalEarnings: 12850,
  highestBid: 50000,
  averageBid: 8500,
  currentRank: 12,
  tier: 'Tier 1' as const,
}

const mockMatchHistory = [
  {
    matchId: 'match-001',
    opponent: 'ProBidder',
    result: 'win' as const,
    yourBid: 5000,
    opponentBid: 3500,
    earnings: 2500,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    matchId: 'match-002',
    opponent: 'StrategyKing',
    result: 'loss' as const,
    yourBid: 8000,
    opponentBid: 9500,
    earnings: -8000,
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    matchId: 'match-003',
    opponent: 'CalmBidder',
    result: 'win' as const,
    yourBid: 4200,
    opponentBid: 3100,
    earnings: 1500,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
]

const mockLeaderboard = [
  {
    rank: 1,
    playerId: '1',
    playerName: 'ProBidder',
    score: 125000,
    winRate: 0.78,
    matches: 42,
  },
  {
    rank: 2,
    playerId: '2',
    playerName: 'StrategyKing',
    score: 98500,
    winRate: 0.72,
    matches: 38,
  },
  {
    rank: 3,
    playerId: '3',
    playerName: 'CalmBidder',
    score: 87200,
    winRate: 0.68,
    matches: 35,
  },
  {
    rank: 12,
    playerId: '12',
    playerName: 'YourUsername',
    score: 12850,
    winRate: 0.667,
    matches: 42,
  },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'leaderboard'>('stats')

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {mockUserStats.username.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* User Info */}
            <div>
              <h1 className="text-3xl font-bold text-white">{mockUserStats.username}</h1>
              <p className="text-slate-400 mt-1">
                Joined {mockUserStats.joinDate.toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-3">
                <Badge variant="primary">Rank #{mockUserStats.currentRank}</Badge>
                <Badge variant="success">{mockUserStats.tier}</Badge>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-400">
                {mockUserStats.totalMatches}
              </p>
              <p className="text-sm text-slate-400">Matches</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">
                {(mockUserStats.winRate * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-slate-400">Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-pink-400">
                ${(mockUserStats.totalEarnings / 100).toFixed(0)}
              </p>
              <p className="text-sm text-slate-400">Earnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-700">
        {(['stats', 'history', 'leaderboard'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'stats' && 'Statistics'}
            {tab === 'history' && 'Match History'}
            {tab === 'leaderboard' && 'Global Leaderboard'}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance */}
          <Card title="Match Performance">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-400">Wins</span>
                  <span className="font-semibold text-emerald-400">{mockUserStats.wins}</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${(mockUserStats.wins / mockUserStats.totalMatches) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-400">Losses</span>
                  <span className="font-semibold text-red-400">{mockUserStats.losses}</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(mockUserStats.losses / mockUserStats.totalMatches) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Win/Loss Ratio</p>
                <p className="text-2xl font-bold text-indigo-400">
                  {mockUserStats.wins}:{mockUserStats.losses}
                </p>
              </div>
            </div>
          </Card>

          {/* Bidding Stats */}
          <Card title="Bidding Statistics">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Highest Bid</p>
                <p className="text-2xl font-bold text-pink-400">
                  ${(mockUserStats.highestBid / 100).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Average Bid</p>
                <p className="text-2xl font-bold text-indigo-400">
                  ${(mockUserStats.averageBid / 100).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Total Winnings</p>
                <p className="text-2xl font-bold text-emerald-400">
                  ${(mockUserStats.totalEarnings / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card title="Recent Matches">
          <div className="space-y-3">
            {mockMatchHistory.map((match) => (
              <div
                key={match.matchId}
                className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-slate-50">vs {match.opponent}</p>
                    <Badge
                      variant={match.result === 'win' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {match.result === 'win' ? 'Win' : 'Loss'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {match.date.toLocaleDateString()} at{' '}
                    {match.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-sm text-slate-400 mb-1">
                    Your bid: ${(match.yourBid / 100).toFixed(2)} • Opponent:{' '}
                    ${(match.opponentBid / 100).toFixed(2)}
                  </p>
                  <p
                    className={`font-semibold text-lg ${match.result === 'win' ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {match.result === 'win' ? '+' : '-'}${Math.abs(match.earnings / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <Card title="Top Players Worldwide">
          <Leaderboard
            entries={mockLeaderboard}
            currentUserId="12"
            variant="detailed"
          />
        </Card>
      )}
    </div>
  )
}

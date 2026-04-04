'use client'

import Link from 'next/link'
import { Button, Card } from '@/components/ui'
import { Leaderboard } from '@/components/game'

// Mock data for demo
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
]

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
                <span className="gradient-text">Strategic</span> Real-time
                <br />
                Competitive Bidding
              </h1>
              <p className="text-xl text-slate-300 mt-4 leading-relaxed">
                Challenge players, place strategic bids, and win real money with instant settlement.
                Every match is server-authoritative, fair, and transparent.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/lobby">
                <Button size="lg" className="w-full sm:w-auto">
                  Join a Match
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Sign Up
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-700">
              <div>
                <p className="text-3xl font-bold text-indigo-400">50K+</p>
                <p className="text-sm text-slate-400">Active Players</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-pink-400">$2.5M+</p>
                <p className="text-sm text-slate-400">In Matches</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-400">24/7</p>
                <p className="text-sm text-slate-400">Live Games</p>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative h-[400px] rounded-lg border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-bold text-white">⚡</span>
                </div>
                <p className="text-slate-400">Real-time bidding interface</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-8">Why OutBid?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card title="⚙️ Server-Authoritative" description="Fair & Transparent">
            <p className="text-slate-300">
              All bids are validated server-side. No cheating, no exploits. Every decision is logged
              and immutable.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card title="🛡️ Real-Money Escrow" description="Instant Settlements">
            <p className="text-slate-300">
              Entry fees held in escrow until match completion. Winners paid instantly. No delays,
              no disputes.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card title="⚡ Real-Time Gameplay" description="Live Updates">
            <p className="text-slate-300">
              Socket.io powered live updates. See bids, timers, and results instantly. Never miss a
              moment.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card title="💳 Multiple Payment Options" description="Flexible Deposits">
            <p className="text-slate-300">
              Stripe cards, M-Pesa mobile money, and cryptocurrency. Choose what works for you.
            </p>
          </Card>

          {/* Feature 5 */}
          <Card title="📊 Transparent Leaderboards" description="Track Your Progress">
            <p className="text-slate-300">
              Global rankings, match history, win rates, and earnings. Compete and climb the ranks.
            </p>
          </Card>

          {/* Feature 6 */}
          <Card title="🔐 KYC & Compliance" description="Regulatory Compliant">
            <p className="text-slate-300">
              Full KYC verification tiers. Withdrawal limits scale with verification level. Safe and
              legal.
            </p>
          </Card>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-6">Global Leaderboard</h2>
            <Leaderboard entries={mockLeaderboard} variant="detailed" />
            <Link href="/profile" className="block mt-6">
              <Button variant="secondary" className="w-full">
                View Full Leaderboard
              </Button>
            </Link>
          </div>

          {/* How It Works */}
          <div>
            <h3 className="text-2xl font-bold mb-6">How It Works</h3>
            <div className="space-y-4">
              {[
                { num: 1, title: 'Create or Join', desc: 'Set your entry fee' },
                { num: 2, title: 'Strategic Bid', desc: 'Place your bid secretly' },
                { num: 3, title: 'Reveal', desc: 'Bids revealed simultaneously' },
                { num: 4, title: 'Win Instantly', desc: 'Get paid to your wallet' },
              ].map((step) => (
                <div key={step.num} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
                    {step.num}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-50">{step.title}</p>
                    <p className="text-sm text-slate-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-indigo-600/10 to-pink-600/10 border border-indigo-500/20 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Compete?</h2>
        <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
          Join thousands of strategic players. Every match is an opportunity to test your skills and
          earn real rewards.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="min-w-48">
              Create Account
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="secondary" size="lg" className="min-w-48">
              Sign In
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

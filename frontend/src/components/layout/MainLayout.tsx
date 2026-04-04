/**
 * MainLayout component - Root layout with navigation and global UI
 * Features: Top navbar, responsive grid, dark mode toggle
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold">Ø</span>
              </div>
              <span className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                OutBid
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/lobby"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Lobby
              </Link>
              <Link
                href="/match"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Matches
              </Link>
              <Link
                href="/wallet"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Wallet
              </Link>
              <Link
                href="/profile"
                className="text-slate-300 hover:text-white transition-colors font-medium"
              >
                Profile
              </Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm text-slate-300">{user.username}</p>
                  <p className="text-xs text-slate-500">Connected</p>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t border-slate-800">
              <Link
                href="/lobby"
                className="block px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Lobby
              </Link>
              <Link
                href="/match"
                className="block px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Matches
              </Link>
              <Link
                href="/wallet"
                className="block px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Wallet
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Profile
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="font-bold text-white mb-3">OutBid</h3>
              <p className="text-sm text-slate-400">
                Strategic real-time competitive bidding with instant settlements and real-money escrow.
              </p>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Fair Play Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Report Issue
                  </a>
                </li>
              </ul>
            </div>

            {/* Status */}
            <div>
              <h4 className="font-semibold text-white mb-3">Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-slate-300">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400">
            <p>&copy; 2026 OutBid. All rights reserved.</p>
            <p>Made with passion for competitive strategy gaming</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

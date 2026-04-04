'use client'

/**
 * useSocket - Custom hook for Socket.io connection management
 * Handles reconnection, event binding, and cleanup
 */

import { useEffect, useRef, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/stores/auth.store'
import { useMatchStore } from '@/stores/match.store'
import { useWalletStore } from '@/stores/wallet.store'
import type { Socket } from 'socket.io-client'
import type { MatchPhase } from '@/stores/match.store'

interface UseSocketOptions {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: any) => void
}

export function useSocket(options?: UseSocketOptions): Socket {
  const socket = getSocket()
  const ref = useRef(socket)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Authenticate socket with user data
    if (user && ref.current) {
      ref.current.auth = {
        userId: user.id,
        token: user.token || '',
      }
    }
  }, [user])

  useEffect(() => {
    const sock = ref.current

    const handleConnect = () => {
      console.log('Socket connected:', sock.id)
      options?.onConnect?.()
    }

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason)
      options?.onDisconnect?.()
    }

    const handleError = (error: any) => {
      console.error('Socket error:', error)
      options?.onError?.(error)
    }

    sock.on('connect', handleConnect)
    sock.on('disconnect', handleDisconnect)
    sock.on('error', handleError)

    return () => {
      sock.off('connect', handleConnect)
      sock.off('disconnect', handleDisconnect)
      sock.off('error', handleError)
    }
  }, [options])

  useEffect(() => {
    return () => {
      ref.current.disconnect()
    }
  }, [])

  return socket
}

/**
 * useMatch - Real-time match state synchronization
 */

export function useMatch(matchId: string | null) {
  const socket = useSocket()
  const {
    initializeMatch,
    updatePhase,
    updateBid,
    revealBid,
    updateScore,
    setCurrentHighBid,
    completeMatch,
  } = useMatchStore()

  const emit = useCallback(
    (event: string, data?: any) => {
      if (socket?.connected) {
        socket.emit(event, data)
      } else {
        console.warn(`Socket not connected, cannot emit ${event}`)
      }
    },
    [socket],
  )

  useEffect(() => {
    if (!matchId || !socket) return

    // Listen for match initialization
    socket.on('match:initialized', (data: any) => {
      initializeMatch({
        matchId: data.id,
        entryFee: data.entryFee,
        players: data.players,
      })
    })

    // Listen for phase changes
    socket.on('match:phase-change', (phase: MatchPhase) => {
      updatePhase(phase)
    })

    // Listen for bid updates
    socket.on('match:bid-placed', (data: { playerId: string; bid: number }) => {
      updateBid(data.playerId, data.bid)
      setCurrentHighBid(Math.max(data.bid, 0))
    })

    // Listen for bid reveals
    socket.on('match:bid-revealed', (data: { playerId: string; bid: number }) => {
      revealBid(data.playerId)
      updateScore(data.playerId, data.bid)
    })

    // Listen for match completion
    socket.on('match:completed', (data: { winner: string; winnings: number }) => {
      completeMatch(data.winnings)
    })

    return () => {
      socket.off('match:initialized')
      socket.off('match:phase-change')
      socket.off('match:bid-placed')
      socket.off('match:bid-revealed')
      socket.off('match:completed')
    }
  }, [matchId, socket, initializeMatch, updatePhase, updateBid, revealBid, updateScore, setCurrentHighBid, completeMatch])

  const placeBid = useCallback(
    (amount: number) => {
      emit('match:place-bid', { matchId, amount })
    },
    [emit, matchId],
  )

  return {
    placeBid,
    joinMatch: () => emit('match:join', { matchId }),
    leaveMatch: () => emit('match:leave', { matchId }),
  }
}

/**
 * useWallet - Real-time wallet balance synchronization
 */

export function useWallet() {
  const socket = useSocket()
  const { updateBalance, addTransaction, setKycTier, setDailyLimitRemaining } =
    useWalletStore()

  const emit = useCallback(
    (event: string, data?: any) => {
      if (socket?.connected) {
        socket.emit(event, data)
      }
    },
    [socket],
  )

  useEffect(() => {
    if (!socket) return

    // Listen for balance updates
    socket.on('wallet:balance-updated', (data: { available: number; escrow: number }) => {
      updateBalance(data.available, data.escrow)
    })

    // Listen for new transactions
    socket.on('wallet:transaction-added', (transaction: any) => {
      addTransaction({
        ...transaction,
        timestamp: new Date(transaction.timestamp),
      })
    })

    // Listen for KYC updates
    socket.on('wallet:kyc-updated', (data: { tier: string }) => {
      setKycTier(data.tier as any)
    })

    // Listen for daily limit updates
    socket.on('wallet:daily-limit-updated', (data: { remaining: number }) => {
      setDailyLimitRemaining(data.remaining)
    })

    return () => {
      socket.off('wallet:balance-updated')
      socket.off('wallet:transaction-added')
      socket.off('wallet:kyc-updated')
      socket.off('wallet:daily-limit-updated')
    }
  }, [socket, updateBalance, addTransaction, setKycTier, setDailyLimitRemaining])

  const depositFunds = useCallback(
    (amount: number, provider: 'stripe' | 'm-pesa' | 'crypto') => {
      emit('wallet:deposit-init', { amount, provider })
    },
    [emit],
  )

  const withdrawFunds = useCallback(
    (amount: number, destination: string) => {
      emit('wallet:withdraw-init', { amount, destination })
    },
    [emit],
  )

  return {
    depositFunds,
    withdrawFunds,
    requestKycVerification: () => emit('wallet:kyc-request'),
  }
}

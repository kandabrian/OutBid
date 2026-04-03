/**
 * Match service - Room management and server-authoritative logic
 * All bid validation happens here (never trust client)
 * Redis for real-time state, PostgreSQL for persistence
 */

import { randomUUID } from 'crypto'
import { db } from '../../db'
import { matches, escrowHolds, walletLedger, wallets } from '../../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import {
  MatchNotFoundError,
  InvalidMatchStateError,
  InsufficientBalanceError,
  UnauthorizedError,
} from '../../lib/errors'
import { redis } from '../../lib/redis'
import * as redisHelpers from '../../lib/redis'
import { logger } from '../../lib/logger'
import type {
  Match,
  MatchRoom,
  PlayerState,
  BidEvent,
  BidValidationResult,
  RoomState,
  MatchSettlement,
  MatchStatus,
} from './types'

const MATCH_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const PLATFORM_FEE_PERCENT = 5 // 5% platform fee
const BID_MIN = 1 // 1 cent minimum
const BID_MAX = 9999999 // 99,999.99 max

export class MatchService {
  /**
   * Create a new match lobby
   * Entry fee is locked in escrow immediately
   */
  async createMatch(player1Id: string, entryFee: number): Promise<Match> {
    if (entryFee < 100 || entryFee > 9999999) {
      throw new InvalidMatchStateError('Entry fee must be between $1 and $99,999.99')
    }

    // Verify player exists and has sufficient balance
    const [wallet] = await db
      .select({
        balance: wallets.balance,
      })
      .from(wallets)
      .where(eq(wallets.userId, player1Id))

    if (!wallet) {
      throw new InsufficientBalanceError(0, 0)
    }

    // Calculate available balance (balance - active escrow holds)
    const escrowResult = await db
      .select({
        escrowSum: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(escrowHolds)
      .where(
        and(
          eq(escrowHolds.userId, player1Id),
          eq(escrowHolds.released, false)
        )
      )

    const escrowAmount = escrowResult[0]?.escrowSum || 0
    const availableBalance = wallet.balance - escrowAmount

    if (availableBalance < entryFee) {
      throw new InsufficientBalanceError(entryFee, availableBalance)
    }

    // Create match in database
    const matchId = randomUUID()
    const roomToken = this.generateRoomToken()

    const [match] = await db
      .insert(matches)
      .values({
        id: matchId,
        player1Id,
        entryFee,
        status: 'waiting',
        roomToken,
      })
      .returning()

    // Lock entry fee in escrow
    await db.insert(escrowHolds).values({
      id: randomUUID(),
      matchId: matchId,
      userId: player1Id,
      amount: entryFee,
      released: false,
    })

    // Initialize Redis room state
    const roomState: RoomState = {
      matchId,
      roomKey: `match:${matchId}`,
      players: {},
      status: 'waiting',
      bids: [],
      currentHighBid: 0,
      currentBidder: null,
      lastUpdateAt: Date.now(),
    }
    await redisHelpers.setWithExpiry(`match:${matchId}`, JSON.stringify(roomState), MATCH_TIMEOUT / 1000)

    logger.info({ matchId, player1Id, entryFee }, 'Match created')

    return {
      ...match,
      status: match.status as MatchStatus,
      createdAt: match.createdAt || new Date(),
    }
  }

  /**
   * Join existing match
   * Server-side validation: wallet balance, match state
   */
  async joinMatch(matchId: string, player2Id: string): Promise<Match> {
    // Get match
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1)

    if (!match) {
      throw new MatchNotFoundError()
    }

    if (match.status !== 'waiting') {
      throw new InvalidMatchStateError('Match is not accepting players')
    }

    if (match.player2Id) {
      throw new InvalidMatchStateError('Match already has 2 players')
    }

    if (match.player1Id === player2Id) {
      throw new InvalidMatchStateError('Cannot join your own match')
    }

    // Verify player2 has sufficient balance
    const [wallet] = await db
      .select({
        balance: wallets.balance,
      })
      .from(wallets)
      .where(eq(wallets.userId, player2Id))

    if (!wallet) {
      throw new InsufficientBalanceError(0, 0)
    }

    // Calculate available balance
    const escrowResult = await db
      .select({
        escrowSum: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(escrowHolds)
      .where(
        and(
          eq(escrowHolds.userId, player2Id),
          eq(escrowHolds.released, false)
        )
      )

    const escrowAmount = escrowResult[0]?.escrowSum || 0
    const availableBalance = wallet.balance - escrowAmount

    if (availableBalance < match.entryFee) {
      throw new InsufficientBalanceError(match.entryFee, availableBalance)
    }

    // Update match with player2 and start
    const [updated] = await db
      .update(matches)
      .set({
        player2Id,
        status: 'active',
        startedAt: new Date(),
      })
      .where(eq(matches.id, matchId))
      .returning()

    // Lock entry fee in escrow for player2
    await db.insert(escrowHolds).values({
      id: randomUUID(),
      matchId,
      userId: player2Id,
      amount: match.entryFee,
      released: false,
    })

    // Update Redis room state
    const roomState: RoomState = {
      matchId,
      roomKey: `match:${matchId}`,
      players: {
        [match.player1Id]: {
          userId: match.player1Id,
          username: (await this.getUsername(match.player1Id)) || 'Player 1',
          currentBid: 0,
          bidCount: 0,
          lastBidAt: null,
          isActive: true,
        },
        [player2Id]: {
          userId: player2Id,
          username: (await this.getUsername(player2Id)) || 'Player 2',
          currentBid: 0,
          bidCount: 0,
          lastBidAt: null,
          isActive: true,
        },
      },
      status: 'active',
      bids: [],
      currentHighBid: 0,
      currentBidder: null,
      lastUpdateAt: Date.now(),
    }
    await redisHelpers.setWithExpiry(`match:${matchId}`, JSON.stringify(roomState), MATCH_TIMEOUT / 1000)

    logger.info({ matchId, player1Id: match.player1Id, player2Id }, 'Match started')

    return {
      ...updated,
      status: updated.status as MatchStatus,
      createdAt: updated.createdAt || new Date(),
    }
  }

  /**
   * Get match details
   */
  async getMatch(matchId: string): Promise<Match> {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1)

    if (!match) {
      throw new MatchNotFoundError()
    }

    return {
      ...match,
      status: match.status as MatchStatus,
      createdAt: match.createdAt || new Date(),
    }
  }

  /**
   * Server-authoritative bid validation and placement
   * Called by WebSocket handler, never directly by client
   */
  async validateAndPlaceBid(
    matchId: string,
    userId: string,
    bidAmount: number
  ): Promise<BidValidationResult> {
    // Get match
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1)

    if (!match) {
      return {
        isValid: false,
        error: 'Match not found',
      }
    }

    // Verify player is in this match
    if (match.player1Id !== userId && match.player2Id !== userId) {
      return {
        isValid: false,
        error: 'Player not in this match',
        reason: 'player_not_active',
      }
    }

    // Match must be active
    if (match.status !== 'active') {
      return {
        isValid: false,
        error: 'Match not in active state',
        reason: 'match_ended',
      }
    }

    // Validate bid amount
    if (bidAmount < BID_MIN || bidAmount > BID_MAX) {
      return {
        isValid: false,
        error: `Bid must be between ${BID_MIN} and ${BID_MAX}`,
        reason: 'invalid_amount',
      }
    }

    // Check available balance (including this bid)
    const [wallet] = await db
      .select({
        balance: wallets.balance,
      })
      .from(wallets)
      .where(eq(wallets.userId, userId))

    if (!wallet) {
      return {
        isValid: false,
        error: 'Wallet not found',
        reason: 'insufficient_balance',
      }
    }

    const escrowResult = await db
      .select({
        escrowSum: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(escrowHolds)
      .where(
        and(
          eq(escrowHolds.userId, userId),
          eq(escrowHolds.released, false)
        )
      )

    const escrowAmount = escrowResult[0]?.escrowSum || 0
    const availableBalance = wallet.balance - escrowAmount

    // Need to cover bid + entry fee already held in escrow
    if (availableBalance < bidAmount) {
      return {
        isValid: false,
        error: 'Insufficient balance for bid',
        reason: 'insufficient_balance',
      }
    }

    // Record bid in Redis
    const roomStateStr = await redis.get(`match:${matchId}`)
    if (!roomStateStr) {
      return {
        isValid: false,
        error: 'Room state not found',
      }
    }

    const roomState: RoomState = JSON.parse(roomStateStr)
    const sequenceNumber = roomState.bids.length + 1

    const bidEvent: BidEvent = {
      matchId,
      userId,
      amount: bidAmount,
      timestamp: new Date(),
      sequenceNumber,
    }

    roomState.bids.push(bidEvent)
    roomState.currentHighBid = bidAmount
    roomState.currentBidder = userId
    roomState.players[userId].currentBid = bidAmount
    roomState.players[userId].bidCount += 1
    roomState.players[userId].lastBidAt = new Date()
    roomState.lastUpdateAt = Date.now()

    await redisHelpers.setWithExpiry(`match:${matchId}`, JSON.stringify(roomState), MATCH_TIMEOUT / 1000)

    return {
      isValid: true,
    }
  }

  /**
   * Complete match and process settlement
   */
  async completeMatch(matchId: string, winnerId: string): Promise<MatchSettlement> {
    // Get match
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1)

    if (!match) {
      throw new MatchNotFoundError()
    }

    if (match.status !== 'active') {
      throw new InvalidMatchStateError('Match is not active')
    }

    // Verify winner is a player in the match
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      throw new UnauthorizedError()
    }

    const loserId =
      winnerId === match.player1Id ? match.player2Id! : match.player1Id

    // Execute settlement in transaction
    const settlement = await db.transaction(async (tx) => {
      // Update match status
      await tx
        .update(matches)
        .set({
          status: 'completed',
          winnerId,
          completedAt: new Date(),
        })
        .where(eq(matches.id, matchId))

      // Calculate payouts
      const platformFee = Math.floor((match.entryFee * PLATFORM_FEE_PERCENT) / 100)
      const winnerPayout = match.entryFee * 2 - platformFee

      // Release escrow holds
      await tx
        .update(escrowHolds)
        .set({ released: true, releasedAt: new Date() })
        .where(
          and(
            eq(escrowHolds.matchId, matchId),
            eq(escrowHolds.released, false)
          )
        )

      // Record winner payout
      await tx.insert(walletLedger).values({
        id: randomUUID(),
        userId: winnerId,
        amount: winnerPayout,
        type: 'match_win',
        relatedMatchId: matchId,
        description: `Won match ${matchId}`,
      })

      // Record loser loss (negative)
      await tx.insert(walletLedger).values({
        id: randomUUID(),
        userId: loserId,
        amount: -match.entryFee,
        type: 'match_loss',
        relatedMatchId: matchId,
        description: `Lost match ${matchId}`,
      })

      // Update wallet balances
      await tx
        .update(wallets)
        .set({
          balance: wallets.balance as any + winnerPayout,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, winnerId))

      await tx
        .update(wallets)
        .set({
          balance: wallets.balance as any - match.entryFee,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, loserId))

      return {
        matchId,
        winnerId,
        loserIds: [loserId],
        entryFee: match.entryFee,
        platformFeePercentage: PLATFORM_FEE_PERCENT,
        payouts: [
          { userId: winnerId, amount: winnerPayout },
          { userId: loserId, amount: -match.entryFee },
        ],
      }
    })

    // Clean up Redis
    await redisHelpers.deleteKey(`match:${matchId}`)

    logger.info({ matchId, winnerId, settlement }, 'Match completed')

    return settlement
  }

  /**
   * Cancel match and refund entry fees
   */
  async cancelMatch(matchId: string, reason: string = 'timeout'): Promise<void> {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1)

    if (!match) {
      throw new MatchNotFoundError()
    }

    await db.transaction(async (tx) => {
      // Update match status
      await tx
        .update(matches)
        .set({
          status: 'cancelled',
          completedAt: new Date(),
        })
        .where(eq(matches.id, matchId))

      // Get escrow holds
      const holds = await tx
        .select()
        .from(escrowHolds)
        .where(
          and(
            eq(escrowHolds.matchId, matchId),
            eq(escrowHolds.released, false)
          )
        )

      // Release escrow and refund
      for (const hold of holds) {
        await tx
          .update(escrowHolds)
          .set({ released: true, releasedAt: new Date() })
          .where(eq(escrowHolds.id, hold.id))

        // Refund entry fee
        await tx.insert(walletLedger).values({
          id: randomUUID(),
          userId: hold.userId,
          amount: hold.amount,
          type: 'refund',
          relatedMatchId: matchId,
          description: `Refund for cancelled match ${matchId} (${reason})`,
        })

        // Update wallet balance
        await tx
          .update(wallets)
          .set({
            balance: wallets.balance as any + hold.amount,
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, hold.userId))
      }
    })

    // Clean up Redis
    await redisHelpers.deleteKey(`match:${matchId}`)

    logger.info({ matchId, reason }, 'Match cancelled')
  }

  /**
   * Get list of available matches (waiting for player 2)
   */
  async getAvailableMatches(limit = 50, offset = 0): Promise<{
    matches: Match[]
    total: number
  }> {
    const matchList = await db
      .select()
      .from(matches)
      .where(eq(matches.status, 'waiting'))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(matches)
      .where(eq(matches.status, 'waiting'))

    return {
      matches: matchList.map((m) => ({
        ...m,
        status: m.status as MatchStatus,
        createdAt: m.createdAt || new Date(),
      })),
      total: countResult[0]?.count || 0,
    }
  }

  /**
   * Helper: Generate secure room token
   */
  private generateRoomToken(): string {
    return randomUUID()
  }

  /**
   * Helper: Get username for player
   */
  private async getUsername(userId: string): Promise<string | null> {
    // For now return null - in production use separate user service call
    return null
  }
}

export const matchService = new MatchService()

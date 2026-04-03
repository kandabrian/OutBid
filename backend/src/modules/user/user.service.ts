/**
 * User service - Profile and statistics management
 */

import { randomUUID } from 'crypto'
import { db } from '../../db'
import { users, matches, walletLedger } from '../../db/schema'
import { eq, or, sql, and, sum } from 'drizzle-orm'
import { UserNotFoundError, UnauthorizedError } from '../../lib/errors'
import type { UserProfile, PlayerStats } from './types'

export class UserService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new UserNotFoundError()
    }

    return {
      id: user.id,
      email: user.email || undefined,
      username: user.username,
      createdAt: user.createdAt || new Date(),
    }
  }

  /**
   * Update user profile
   * Only the user can update their own profile
   */
  async updateProfile(
    userId: string,
    updates: {
      username?: string
      avatar?: string
      bio?: string
    }
  ): Promise<UserProfile> {
    // Validate user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new UserNotFoundError()
    }

    // TODO: Validate username uniqueness if changed
    // TODO: Validate avatar URL format

    // Update user record
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning()

    return {
      id: updated.id,
      email: updated.email || undefined,
      username: updated.username,
      createdAt: updated.createdAt || new Date(),
    }
  }

  /**
   * Get player statistics (wins, losses, earnings)
   * Computed from matches and wallet ledger
   */
  async getStats(userId: string): Promise<PlayerStats> {
    // Validate user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new UserNotFoundError()
    }

    // Count matches played
    const matchesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(
        or(
          eq(matches.player1Id, userId),
          eq(matches.player2Id, userId)
        )
      )

    const matchesPlayed = matchesResult[0]?.count || 0

    // Count matches won
    const winsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(eq(matches.winnerId, userId))

    const matchesWon = winsResult[0]?.count || 0

    // Calculate earnings (sum of positive ledger entries)
    const earningsResult = await db
      .select({ total: sum(walletLedger.amount) })
      .from(walletLedger)
      .where(
        and(
          eq(walletLedger.userId, userId),
          sql`${walletLedger.amount} > 0`
        )
      )

    const totalEarnings = earningsResult[0]?.total ? Number(earningsResult[0].total) : 0

    // Calculate losses (sum of negative ledger entries)
    const lossesResult = await db
      .select({ total: sum(walletLedger.amount) })
      .from(walletLedger)
      .where(
        and(
          eq(walletLedger.userId, userId),
          sql`${walletLedger.amount} < 0`
        )
      )

    const totalLosses = lossesResult[0]?.total ? Math.abs(Number(lossesResult[0].total)) : 0

    // Calculate average bid per match
    const averageBid = matchesPlayed > 0 ? totalEarnings / matchesPlayed : 0

    return {
      userId,
      matchesPlayed,
      matchesWon,
      totalEarnings,
      averageBid,
    }
  }
}

export const userService = new UserService()

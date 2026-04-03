/**
 * Socket.io room service
 * Manages match rooms, player connections, and Redis state persistence
 */

import { Socket, Server } from 'socket.io'
import { redis } from '../../lib/redis'
import * as redisHelpers from '../../lib/redis'
import { logger } from '../../lib/logger'
import type { RoomState } from '../../modules/match/types'

const MATCH_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export class RoomService {
  /**
   * Join player to match room
   * Stores room state in Redis for multi-server scaling
   */
  async joinRoom(socket: Socket, matchId: string, userId: string): Promise<void> {
    // Add socket to room
    socket.join(`match:${matchId}`)

    // Store player connection in Redis
    const playerKey = `match:${matchId}:players`
    await redis.sadd(playerKey, userId)
    await redisHelpers.setWithExpiry(`player:${userId}:socket`, socket.id, 86400) // 24h

    // Update room state with active player
    const roomState = await this.getMatchState(matchId)
    if (roomState && roomState.players[userId]) {
      roomState.players[userId].isActive = true
      roomState.lastUpdateAt = Date.now()
      await this.saveMatchState(matchId, roomState)
    }

    logger.info({ matchId, userId }, 'Player joined room')
  }

  /**
   * Leave match room
   */
  async leaveRoom(socket: Socket, matchId: string, userId: string): Promise<void> {
    // Remove from socket.io room
    socket.leave(`match:${matchId}`)

    // Remove from Redis
    const playerKey = `match:${matchId}:players`
    await redis.srem(playerKey, userId)
    await redisHelpers.deleteKey(`player:${userId}:socket`)

    // Update room state to mark as inactive
    const roomState = await this.getMatchState(matchId)
    if (roomState && roomState.players[userId]) {
      roomState.players[userId].isActive = false
      roomState.lastUpdateAt = Date.now()
      await this.saveMatchState(matchId, roomState)
    }

    logger.info({ matchId, userId }, 'Player left room')
  }

  /**
   * Get match state from Redis
   */
  async getMatchState(matchId: string): Promise<RoomState | null> {
    try {
      const stateStr = await redis.get(`match:${matchId}`)
      if (!stateStr) {
        return null
      }
      return JSON.parse(stateStr)
    } catch (err) {
      logger.error({ error: err, matchId }, 'Failed to get match state')
      return null
    }
  }

  /**
   * Save match state to Redis
   */
  async saveMatchState(matchId: string, state: RoomState): Promise<void> {
    try {
      await redisHelpers.setWithExpiry(
        `match:${matchId}`,
        JSON.stringify(state),
        MATCH_TIMEOUT / 1000
      )
    } catch (err) {
      logger.error({ error: err, matchId }, 'Failed to save match state')
    }
  }

  /**
   * Get active players in room
   */
  async getPlayers(matchId: string): Promise<string[]> {
    try {
      const players = await redis.smembers(`match:${matchId}:players`)
      return players || []
    } catch (err) {
      logger.error({ error: err, matchId }, 'Failed to get players')
      return []
    }
  }

  /**
   * Check if player is active in room
   */
  async isPlayerActive(matchId: string, userId: string): Promise<boolean> {
    try {
      const players = await this.getPlayers(matchId)
      return players.includes(userId)
    } catch (err) {
      logger.error({ error: err }, 'Failed to check player active status')
      return false
    }
  }

  /**
   * Broadcast event to all players in room
   */
  async broadcastToRoom(
    io: Server,
    matchId: string,
    event: string,
    data: any
  ): Promise<void> {
    try {
      io.to(`match:${matchId}`).emit(event, data)
      logger.debug({ matchId, event }, 'Broadcast sent to room')
    } catch (err) {
      logger.error({ error: err }, 'Failed to broadcast to room')
    }
  }

  /**
   * Broadcast to specific player
   */
  async broadcastToPlayer(
    io: Server,
    userId: string,
    event: string,
    data: any
  ): Promise<void> {
    try {
      const socketId = await redis.get(`player:${userId}:socket`)
      if (socketId) {
        io.to(socketId).emit(event, data)
      }
    } catch (err) {
      logger.error({ error: err }, 'Failed to broadcast to player')
    }
  }

  /**
   * Clean up expired match room
   */
  async cleanupRoom(matchId: string): Promise<void> {
    try {
      const playerKey = `match:${matchId}:players`
      const players = await redis.smembers(playerKey)

      // Remove all player socket refs
      for (const userId of players || []) {
        await redisHelpers.deleteKey(`player:${userId}:socket`)
      }

      // Remove room data
      await redisHelpers.deleteKey(playerKey)
      await redisHelpers.deleteKey(`match:${matchId}`)

      logger.info({ matchId }, 'Room cleaned up')
    } catch (err) {
      logger.error({ error: err }, 'Failed to cleanup room')
    }
  }

  /**
   * Get all active matches
   */
  async getActiveMatches(): Promise<string[]> {
    try {
      // For now return empty array - in production use redis.keys('match:*')
      return []
    } catch (err) {
      logger.error({ error: err }, 'Failed to get active matches')
      return []
    }
  }
}

export const roomService = new RoomService()

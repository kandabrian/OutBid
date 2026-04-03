/**
 * Socket.io match event handlers
 * Real-time match room management with server-authoritative validation
 */

import { Socket, Server } from 'socket.io'
import { roomService } from '../services/room.service'
import { matchService } from '../../modules/match/match.service'
import { logger } from '../../lib/logger'

export function registerMatchHandlers(io: Server, socket: Socket) {
  /**
   * match:join - Player joins match room
   * Triggered when player clicks "Join Match"
   */
  socket.on(
    'match:join',
    async (data: { matchId: string }, callback?: (err: any, response?: any) => void) => {
      try {
        const userId = (socket.data as any).userId
        if (!userId) {
          callback?.({
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          })
          return
        }

        // Join the match room
        await roomService.joinRoom(socket, data.matchId, userId)

        // Get match state for confirmation
        const match = await matchService.getMatch(data.matchId)

        logger.info(
          { userId, matchId: data.matchId },
          'Player joined match room'
        )

        // Notify all players in the room
        io.to(`match:${data.matchId}`).emit('match:player-joined', {
          matchId: data.matchId,
          userId,
          timestamp: new Date(),
        })

        callback?.(null, { matchId: data.matchId, status: match.status })
      } catch (err) {
        logger.error({ error: err }, 'Failed to join match')
        callback?.({
          code: 'MATCH_JOIN_FAILED',
          message: err instanceof Error ? err.message : 'Failed to join match',
        })
      }
    }
  )

  /**
   * match:leave - Player leaves match room
   * Triggered when player disconnects or leaves voluntarily
   */
  socket.on(
    'match:leave',
    async (data: { matchId: string }, callback?: (err: any) => void) => {
      try {
        const userId = (socket.data as any).userId
        if (!userId) {
          callback?.({ code: 'UNAUTHORIZED' })
          return
        }

        await roomService.leaveRoom(socket, data.matchId, userId)

        logger.info({ userId, matchId: data.matchId }, 'Player left match room')

        // Notify remaining players
        io.to(`match:${data.matchId}`).emit('match:player-left', {
          matchId: data.matchId,
          userId,
          reason: 'user_left',
          timestamp: new Date(),
        })

        callback?.(null)
      } catch (err) {
        logger.error({ error: err }, 'Failed to leave match')
        callback?.({
          code: 'MATCH_LEAVE_FAILED',
          message: err instanceof Error ? err.message : 'Failed to leave match',
        })
      }
    }
  )

  /**
   * match:place-bid - Player places a bid
   * Server-side validation: wallet balance, match state, bid bounds
   * ACK pattern: client waits for server response before updating UI
   */
  socket.on(
    'match:place-bid',
    async (
      data: { matchId: string; amount: number },
      callback?: (err: any, response?: any) => void
    ) => {
      try {
        const userId = (socket.data as any).userId
        if (!userId) {
          callback?.({ code: 'UNAUTHORIZED' })
          return
        }

        // Validate bid server-side
        const validation = await matchService.validateAndPlaceBid(
          data.matchId,
          userId,
          data.amount
        )

        if (!validation.isValid) {
          logger.warn(
            { userId, matchId: data.matchId, error: validation.error },
            'Bid validation failed'
          )
          callback?.({
            code: 'BID_INVALID',
            message: validation.error,
            reason: validation.reason,
          })
          return
        }

        logger.info(
          { userId, matchId: data.matchId, amount: data.amount },
          'Bid placed successfully'
        )

        // Broadcast bid to all players in the match
        io.to(`match:${data.matchId}`).emit('match:bid-placed', {
          matchId: data.matchId,
          userId,
          amount: data.amount,
          timestamp: new Date(),
        })

        callback?.(null, {
          success: true,
          amount: data.amount,
          timestamp: new Date(),
        })
      } catch (err) {
        logger.error({ error: err }, 'Failed to place bid')
        callback?.({
          code: 'BID_FAILED',
          message: err instanceof Error ? err.message : 'Failed to place bid',
        })
      }
    }
  )

  /**
   * match:sync-request - Player requests full match state after reconnect
   * Used for state recovery when connection drops
   */
  socket.on(
    'match:sync-request',
    async (
      data: { matchId: string },
      callback?: (err: any, response?: any) => void
    ) => {
      try {
        const matchState = await roomService.getMatchState(data.matchId)

        if (!matchState) {
          callback?.({
            code: 'MATCH_NOT_FOUND',
            message: 'Match not found or expired',
          })
          return
        }

        logger.info(
          { matchId: data.matchId },
          'Match state sync requested'
        )

        callback?.(null, {
          matchId: data.matchId,
          state: matchState,
          timestamp: new Date(),
        })
      } catch (err) {
        logger.error({ error: err }, 'Failed to sync match state')
        callback?.({
          code: 'SYNC_FAILED',
          message: 'Failed to sync match state',
        })
      }
    }
  )

  /**
   * Handle unexpected disconnections
   */
  socket.on('disconnect', async () => {
    try {
      const userId = (socket.data as any).userId
      if (userId) {
        logger.info({ userId, socketId: socket.id }, 'Player disconnected')
        // Rooms are auto-cleaned by Socket.io after TTL
      }
    } catch (err) {
      logger.error({ error: err }, 'Error handling disconnect')
    }
  })
}

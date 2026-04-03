/**
 * Bid handler - Real-time bid submission and conflict resolution
 * Works in tandem with match:place-bid in match.handler.ts
 * This handler deals with advanced bidding scenarios like concurrent bids
 */

import { Server, Socket } from 'socket.io'
import { matchService } from '../../modules/match/match.service'
import { roomService } from '../services/room.service'
import { logger } from '../../lib/logger'

export function registerBidHandlers(io: Server, socket: Socket) {
  /**
   * bid:submit-concurrent - Handle concurrent bids from both players
   * Used for conflict resolution when both players submit bids at same time
   */
  socket.on(
    'bid:submit-concurrent',
    async (
      data: { matchId: string; bids: Array<{ userId: string; amount: number }> },
      callback?: (err: any, response?: any) => void
    ) => {
      try {
        const userId = (socket.data as any).userId
        if (!userId) {
          callback?.({ code: 'UNAUTHORIZED' })
          return
        }

        // Process all bids in sequence order
        for (const bid of data.bids) {
          const validation = await matchService.validateAndPlaceBid(
            data.matchId,
            bid.userId,
            bid.amount
          )

          if (!validation.isValid) {
            logger.warn(
              { matchId: data.matchId, userId: bid.userId, error: validation.error },
              'Bid validation failed in concurrent submission'
            )
          }
        }

        // Get latest match state
        const matchState = await roomService.getMatchState(data.matchId)

        logger.info(
          { matchId: data.matchId, bidCount: data.bids.length },
          'Concurrent bids processed'
        )

        callback?.(null, {
          success: true,
          currentHighBid: matchState?.currentHighBid,
          currentBidder: matchState?.currentBidder,
          timestamp: new Date(),
        })
      } catch (err) {
        logger.error({ error: err }, 'Failed to process concurrent bids')
        callback?.({
          code: 'BID_SUBMISSION_FAILED',
          message: err instanceof Error ? err.message : 'Failed to process bids',
        })
      }
    }
  )

  /**
   * bid:retract - Retract/cancel a bid (only within grace period)
   * Grace period: 500ms after bid placement for network uncertainty
   */
  socket.on(
    'bid:retract',
    async (
      data: { matchId: string; bidSequence: number },
      callback?: (err: any, response?: any) => void
    ) => {
      try {
        const userId = (socket.data as any).userId
        if (!userId) {
          callback?.({ code: 'UNAUTHORIZED' })
          return
        }

        const matchState = await roomService.getMatchState(data.matchId)
        if (!matchState) {
          callback?.({ code: 'MATCH_NOT_FOUND' })
          return
        }

        // Find bid
        const bidIndex = matchState.bids.findIndex(
          (b) => b.sequenceNumber === data.bidSequence && b.userId === userId
        )

        if (bidIndex === -1) {
          callback?.({
            code: 'BID_NOT_FOUND',
            message: 'Bid not found or already processed',
          })
          return
        }

        // Check grace period (last 500ms only)
        const bid = matchState.bids[bidIndex]
        const timeSinceBid = Date.now() - new Date(bid.timestamp).getTime()

        if (timeSinceBid > 500) {
          callback?.({
            code: 'BID_LOCKED',
            message: 'Bid cannot be retracted after grace period',
          })
          return
        }

        // Remove bid from state
        matchState.bids.splice(bidIndex, 1)

        // Recalculate highest bid
        if (matchState.bids.length === 0) {
          matchState.currentHighBid = 0
          matchState.currentBidder = null
        } else {
          const highestBid = matchState.bids.reduce(
            (max, bid) => (bid.amount > max ? bid.amount : max),
            0
          )
          matchState.currentHighBid = highestBid
          const bidderOfHighest = matchState.bids.find((b) => b.amount === highestBid)
          matchState.currentBidder = bidderOfHighest?.userId || null
        }

        // Update Redis
        await roomService.saveMatchState(data.matchId, matchState)

        logger.info(
          { matchId: data.matchId, userId, sequence: data.bidSequence },
          'Bid retracted'
        )

        // Notify other player
        io.to(`match:${data.matchId}`).emit('bid:retracted', {
          matchId: data.matchId,
          userId,
          sequence: data.bidSequence,
          currentHighBid: matchState.currentHighBid,
          currentBidder: matchState.currentBidder,
          timestamp: new Date(),
        })

        callback?.(null, { success: true })
      } catch (err) {
        logger.error({ error: err }, 'Failed to retract bid')
        callback?.({
          code: 'BID_RETRACT_FAILED',
          message: err instanceof Error ? err.message : 'Failed to retract bid',
        })
      }
    }
  )

  /**
   * bid:heartbeat - Keep socket alive and update last activity
   */
  socket.on('bid:heartbeat', (data: { matchId: string }) => {
    // Socket.io pings handle this, but custom heartbeat for debugging
    logger.debug({ matchId: data.matchId }, 'Heartbeat received')
  })
}

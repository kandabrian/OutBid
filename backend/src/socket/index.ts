/**
 * Socket.io setup and integration with Fastify
 * Real-time gameplay events and room management
 * TODO: Implement Redis pub/sub for multi-server scaling
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { FastifyInstance } from 'fastify'
import { logger } from '../lib/logger'

export function initializeSocket(app: FastifyInstance) {
  const io = new SocketIOServer(app.server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  })

  /**
   * Middleware: Verify JWT on connection
   */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Missing token'))
      }

      // TODO: Verify JWT token
      // const decoded = app.jwt.verify(token)
      // socket.userId = decoded.userId

      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })

  /**
   * Connection handler
   */
  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as any).userId || socket.id
    logger.info({ userId, socketId: socket.id }, 'Socket connected')

    /**
     * Join match room
     * Broadcasts player:joined event to other player
     */
    socket.on('match:join', async (data: { matchId: string }) => {
      const { matchId } = data
      socket.join(`match:${matchId}`)

      logger.info({ userId, matchId }, 'Player joined match room')

      socket.broadcast.to(`match:${matchId}`).emit('player:joined', {
        playerId: userId,
        timestamp: Date.now(),
      })
    })

    /**
     * Submit bid
     * Server validates, broadcasts to opponent (after reveal phase)
     */
    socket.on('bid:submit', async (data: { matchId: string; amount: number }) => {
      const { matchId, amount } = data
      
      logger.info({ userId, matchId, amount }, 'Bid submitted')

      // TODO: Server-authoritative validation
      // - Verify player is in this match
      // - Verify wallet balance
      // - Store bid in Redis
      // - Wait for both players before reveal phase

      socket.emit('bid:received', { success: true })
    })

    /**
     * Request match state (e.g., after reconnect)
     * Server sends full current state
     */
    socket.on('sync:request', async (data: { matchId: string }) => {
      const { matchId } = data

      // TODO: Get match state from Redis/DB
      // Return: current phase, revealed bids (if applicable), players, etc.

      socket.emit('match:state', {
        matchId,
        phase: 'submission',
        players: [],
      })
    })

    /**
     * Ready signal (player ready to start)
     * When both ready, match begins
     */
    socket.on('match:ready', async (data: { matchId: string }) => {
      const { matchId } = data

      logger.info({ userId, matchId }, 'Player ready')

      // TODO: Check if both players ready
      // If yes: emit match:started to room

      socket.broadcast.to(`match:${matchId}`).emit('player:ready', { playerId: userId })
    })

    /**
     * Leave match (forfeit)
     */
    socket.on('match:leave', async (data: { matchId: string }) => {
      const { matchId } = data

      logger.info({ userId, matchId }, 'Player left match')

      socket.leave(`match:${matchId}`)
      socket.broadcast.to(`match:${matchId}`).emit('player:left', { playerId: userId })

      // TODO: Handle forfeit: other player wins by default
    })

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      logger.info({ userId, socketId: socket.id }, 'Socket disconnected')

      // TODO: Mark player as temporarily offline (30s grace period)
      // If reconnect within 30s, restore state
      // Otherwise, forfeit active matches
    })
  })

  return io
}

export type SocketIOServerType = SocketIOServer
export type SocketIOSocketType = Socket

import { Server } from 'socket.io'
import { createServer } from 'http'
import type { FastifyInstance } from 'fastify'
import { registerBidHandlers } from './handlers/bid.handler'

export function initSocket(app: FastifyInstance) {
  const httpServer = createServer(app.server)
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  })

  io.on('connection', (socket) => {
    console.log('client connected:', socket.id)
    registerBidHandlers(io, socket)
  })

  return httpServer
}

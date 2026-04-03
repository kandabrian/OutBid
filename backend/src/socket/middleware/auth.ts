/**
 * Socket.io authentication middleware
 * Verifies JWT on socket connection
 */

import { Socket } from 'socket.io'
import { InvalidTokenError } from '../../lib/errors'

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: any) => void
) {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token

    if (!token) {
      throw new InvalidTokenError('No token provided')
    }

    // TODO: Verify JWT token
    // const payload = app.jwt.verify(token)
    // socket.user = payload

    next()
  } catch (err) {
    next(err as Error)
  }
}

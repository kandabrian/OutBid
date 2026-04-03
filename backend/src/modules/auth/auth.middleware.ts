/**
 * Auth middleware for Fastify
 * Verifies JWT tokens and guards protected routes
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { InvalidTokenError } from '../../lib/errors'
import { JWTPayload } from '../../lib/types'

/**
 * Fastify JWT verification hook
 * Extracts and validates JWT from Authorization header
 * Sets user context on request
 */
export async function verifyJWT(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
    // User is now available on req.user
  } catch (err) {
    throw new InvalidTokenError('Invalid or expired token')
  }
}

// Extend Fastify Request with user context
declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload
  }

  interface FastifyInstance {
    authenticate: typeof verifyJWT
  }
}

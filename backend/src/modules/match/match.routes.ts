/**
 * Match module routes
 * All routes prefixed with /api/v1/match
 */

import { FastifyInstance } from 'fastify'
import {
  createMatch,
  joinMatch,
  getMatchStatus,
  getAvailableMatches,
  cancelMatch,
} from './match.controller'

export async function matchRoutes(app: FastifyInstance) {
  // Create match (requires auth)
  app.post(
    '/create',
    { onRequest: [app.authenticate] },
    createMatch
  )

  // Get match details
  app.get(
    '/:id',
    getMatchStatus
  )

  // Join match
  app.post(
    '/:id/join',
    { onRequest: [app.authenticate] },
    joinMatch
  )

  // List available lobbies (not yet started)
  app.get(
    '/list/available',
    getAvailableMatches
  )

  // Cancel match (only player1 or match not started)
  app.post(
    '/:id/cancel',
    { onRequest: [app.authenticate] },
    cancelMatch
  )
}

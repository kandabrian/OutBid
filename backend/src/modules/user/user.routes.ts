/**
 * User module routes
 */

import { FastifyInstance } from 'fastify'
import {
  getMyProfile,
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getMyStats,
} from './user.controller'

export async function userRoutes(app: FastifyInstance) {
  // Public profile endpoints
  app.get('/:id', getUserProfile)
  app.get('/:id/stats', getUserStats)

  // Protected user endpoints (require authentication)
  app.get('/me/profile', { onRequest: [app.authenticate] }, getMyProfile)
  app.get('/me/stats', { onRequest: [app.authenticate] }, getMyStats)
  app.put('/:id', { onRequest: [app.authenticate] }, updateUserProfile)
}

import { FastifyInstance } from 'fastify'
import {
  registerHandler,
  loginHandler,
  guestHandler,
  refreshAccessTokenHandler,
  logoutHandler,
  getCurrentUserHandler,
} from './auth.controller'

export async function authRoutes(app: FastifyInstance) {
  // Public routes
  app.post('/register', registerHandler)
  app.post('/login', loginHandler)
  app.post('/guest', guestHandler)
  app.post('/refresh', refreshAccessTokenHandler)

  // Protected routes (require JWT)
  app.post(
    '/logout',
    { onRequest: [app.authenticate] },
    logoutHandler
  )
  app.get(
    '/me',
    { onRequest: [app.authenticate] },
    getCurrentUserHandler
  )
}

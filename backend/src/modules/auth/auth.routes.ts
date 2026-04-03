import { FastifyInstance } from 'fastify'
import { loginHandler, registerHandler, guestHandler } from './auth.controller'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', registerHandler)
  app.post('/login', loginHandler)
  app.post('/guest', guestHandler)
}

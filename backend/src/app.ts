import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { registerRoutes } from './routes'
import { setupErrorHandler } from './lib/errorHandler'
import { createRequestLogger } from './lib/logger'
import { verifyJWT } from './modules/auth/auth.middleware'

export async function buildApp() {
  const app = Fastify({ logger: true })

  // CORS configuration
  await app.register(cors, {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })

  // Cookie support
  await app.register(cookie)

  // JWT support
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  })

  // Add authenticate method to app instance
  app.decorate('authenticate', verifyJWT)

  // Request logging
  app.addHook('onRequest', await createRequestLogger())

  // Global error handler
  setupErrorHandler(app)

  // Register all routes
  await registerRoutes(app)

  return app
}

import { FastifyInstance } from 'fastify'
import { authRoutes } from './modules/auth/auth.routes'
import { matchRoutes } from './modules/match/match.routes'
import { walletRoutes } from './modules/wallet/wallet.routes'

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(matchRoutes, { prefix: '/api/match' })
  app.register(walletRoutes, { prefix: '/api/wallet' })
}

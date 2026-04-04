import { FastifyInstance } from 'fastify'
import { authRoutes } from './modules/auth/auth.routes'
import { userRoutes } from './modules/user/user.routes'
import { matchRoutes } from './modules/match/match.routes'
import { walletRoutes } from './modules/wallet/wallet.routes'
import { paymentRoutes } from './modules/payment/payment.routes'

export async function registerRoutes(app: FastifyInstance) {
  // API v1 routes
  app.register(authRoutes, { prefix: '/api/v1/auth' })
  app.register(userRoutes, { prefix: '/api/v1/users' })
  app.register(matchRoutes, { prefix: '/api/v1/match' })
  app.register(walletRoutes, { prefix: '/api/v1/wallet' })
  app.register(paymentRoutes, { prefix: '/api/v1/payment' })

  // Health check
  app.get('/health', async (req, reply) => {
    return { status: 'ok' }
  })
}

/**
 * Wallet module routes
 */

import { FastifyInstance } from 'fastify'
import {
  getBalance,
  initiateDeposit,
  initiateWithdrawal,
  getTransactionHistory,
} from './wallet.controller'

export async function walletRoutes(app: FastifyInstance) {
  // All wallet routes require authentication
  app.get('/balance', { onRequest: [app.authenticate] }, getBalance)
  app.post('/deposit', { onRequest: [app.authenticate] }, initiateDeposit)
  app.post('/withdraw', { onRequest: [app.authenticate] }, initiateWithdrawal)
  app.get(
    '/transactions',
    { onRequest: [app.authenticate] },
    getTransactionHistory
  )
}

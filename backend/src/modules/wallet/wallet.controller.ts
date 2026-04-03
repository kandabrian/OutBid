/**
 * Wallet module controller - HTTP handlers for wallet operations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { walletService } from './wallet.service'
import { depositInitiateSchema, withdrawalSchema } from '../../lib/validators'
import { logger } from '../../lib/logger'

/**
 * GET /api/v1/wallet/balance
 * Get current wallet balance
 */
export async function getBalance(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const balance = await walletService.getBalance((req.user as any).userId)
  return reply.send(balance)
}

/**
 * POST /api/v1/wallet/deposit
 * Initiate deposit via payment provider
 */
export async function initiateDeposit(
  req: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  const validated = depositInitiateSchema.parse(req.body)
  const userId = (req.user as any).userId

  const deposit = await walletService.initiateDeposit(
    userId,
    validated.amount,
    validated.method,
    validated.idempotencyKey
  )

  logger.info(
    {
      userId,
      amount: validated.amount,
      method: validated.method,
      transactionId: deposit.transactionId,
    },
    'Deposit initiated'
  )

  return reply.status(201).send(deposit)
}

/**
 * POST /api/v1/wallet/withdraw
 * Initiate withdrawal to user's payment method
 */
export async function initiateWithdrawal(
  req: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  const validated = withdrawalSchema.parse(req.body)
  const userId = (req.user as any).userId

  const withdrawal = await walletService.initiateWithdrawal(
    userId,
    validated.amount,
    validated.method,
    validated.idempotencyKey
  )

  logger.info(
    {
      userId,
      amount: validated.amount,
      method: validated.method,
      transactionId: withdrawal.transactionId,
    },
    'Withdrawal initiated'
  )

  return reply.status(201).send(withdrawal)
}

/**
 * GET /api/v1/wallet/transactions
 * Get user's transaction history
 */
export async function getTransactionHistory(
  req: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>,
  reply: FastifyReply
) {
  const limit = Math.min(parseInt(req.query.limit || '50'), 100)
  const offset = parseInt(req.query.offset || '0')
  const userId = (req.user as any).userId

  const transactions = await walletService.getTransactionHistory(
    userId,
    limit,
    offset
  )

  return reply.send({
    transactions,
    pagination: {
      limit,
      offset,
      total: transactions.length,
    },
  })
}

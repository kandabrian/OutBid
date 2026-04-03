/**
 * Payment HTTP controllers
 * Handles payment initiation, webhook processing, and status checking
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { paymentService } from './payment.service'
import {
  StripeIntentRequest,
  MpesaInitiateRequest,
  CryptoDepositRequest,
  PaymentProvider,
} from './types'
import { ValidationError, WebhookVerificationError } from '../../lib/errors'
import { z } from 'zod'
import pino from 'pino'

const logger = pino()

// ============================================================================
// Request Validators
// ============================================================================

const StripeIntentValidator = z.object({
  amount: z.number().int().positive(),
})

const MpesaInitiateValidator = z.object({
  amount: z.number().int().positive(),
  phoneNumber: z.string().regex(/^\+254\d{9}$/),
})

const CryptoDepositValidator = z.object({
  amount: z.number().int().positive(),
  chain: z.enum(['ethereum', 'polygon', 'sepolia', 'mumbai']).optional(),
})

const WithdrawalValidator = z.object({
  amount: z.number().int().positive(),
  provider: z.enum(['stripe', 'mpesa', 'crypto']),
})

// ============================================================================
// Controllers
// ============================================================================

/**
 * Initiate Stripe payment
 * POST /api/v1/payment/stripe/intent
 */
export async function initiateStripeIntent(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = StripeIntentValidator.parse(req.body)
    const userId = (req.user as any).id

    const result = await paymentService.initiateStripeDeposit(userId, body.amount)

    logger.info(
      { userId, amount: body.amount, transactionId: result.transactionId },
      'Stripe intent created'
    )

    reply.status(201).send({
      transactionId: result.transactionId,
      clientSecret: result.clientSecret,
      amount: result.amount,
      provider: result.provider,
    })
  } catch (err) {
    throw err
  }
}

/**
 * Verify Stripe webhook
 * POST /api/v1/payment/webhook/stripe
 */
export async function handleStripeWebhook(req: FastifyRequest, reply: FastifyReply) {
  try {
    const signature = req.headers['stripe-signature'] as string
    if (!signature) {
      throw new WebhookVerificationError('Missing Stripe signature header')
    }

    const payload = JSON.stringify(req.body)

    // Verify webhook signature
    const isValid = paymentService.verifyStripeWebhook(payload, signature)
    if (!isValid) {
      throw new WebhookVerificationError()
    }

    const event = req.body as any

    // Process event asynchronously (don't wait for completion)
    paymentService.handleStripeEvent(event).catch((err) => {
      logger.error(
        { error: err, eventId: event.id },
        'Failed to process Stripe webhook event'
      )
    })

    // Always return 200 to acknowledge receipt
    reply.status(200).send({ received: true })
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      logger.warn('Stripe webhook verification failed')
      return reply.status(401).send({
        error: {
          code: 'WEBHOOK_VERIFICATION_FAILED',
          message: 'Invalid webhook signature',
        },
      })
    }
    throw err
  }
}

/**
 * Initiate M-Pesa deposit
 * POST /api/v1/payment/mpesa/initiate
 */
export async function initiateMpesaDeposit(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = MpesaInitiateValidator.parse(req.body)
    const userId = (req.user as any).id

    const result = await paymentService.initiateMpesaDeposit(
      userId,
      body.amount,
      body.phoneNumber
    )

    logger.info(
      {
        userId,
        amount: body.amount,
        phoneNumber: body.phoneNumber,
        transactionId: result.transactionId,
      },
      'M-Pesa deposit initiated'
    )

    reply.status(201).send({
      transactionId: result.transactionId,
      amount: result.amount,
      phoneNumber: result.phoneNumber,
      status: result.status,
      provider: result.provider,
    })
  } catch (err) {
    throw err
  }
}

/**
 * Verify Paystack webhook (M-Pesa)
 * POST /api/v1/payment/webhook/paystack
 */
export async function handlePaystackWebhook(req: FastifyRequest, reply: FastifyReply) {
  try {
    const signature = req.headers['x-paystack-signature'] as string
    if (!signature) {
      throw new WebhookVerificationError('Missing Paystack signature header')
    }

    const payload = JSON.stringify(req.body)

    // Verify webhook signature
    const isValid = paymentService.verifyPaystackWebhook(payload, signature)
    if (!isValid) {
      throw new WebhookVerificationError()
    }

    const event = req.body as any

    // Process event asynchronously
    paymentService.handlePaystackEvent(event).catch((err) => {
      logger.error(
        { error: err, eventType: event.event },
        'Failed to process Paystack webhook event'
      )
    })

    // Always return 200 to acknowledge receipt
    reply.status(200).send({ received: true })
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      logger.warn('Paystack webhook verification failed')
      return reply.status(401).send({
        error: {
          code: 'WEBHOOK_VERIFICATION_FAILED',
          message: 'Invalid webhook signature',
        },
      })
    }
    throw err
  }
}

/**
 * Initiate crypto deposit
 * POST /api/v1/payment/crypto/address
 */
export async function initiateCryptoDeposit(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CryptoDepositValidator.parse(req.body)
    const userId = (req.user as any).id

    const result = await paymentService.initiateCryptoDeposit(
      userId,
      body.amount,
      body.chain
    )

    logger.info(
      { userId, amount: body.amount, chain: body.chain, transactionId: result.transactionId },
      'Crypto deposit initiated'
    )

    reply.status(201).send({
      transactionId: result.transactionId,
      walletAddress: result.walletAddress,
      amount: result.amount,
      chain: result.chain,
      expiresAt: result.expiresAt,
      provider: result.provider,
    })
  } catch (err) {
    throw err
  }
}

/**
 * Get payment transaction status
 * GET /api/v1/payment/:transactionId/status
 */
export async function getPaymentStatus(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { transactionId } = req.params as { transactionId: string }
    const userId = (req.user as any).id

    const status = await paymentService.getPaymentStatus(transactionId, userId)

    reply.status(200).send(status)
  } catch (err) {
    throw err
  }
}

/**
 * Get transaction history with pagination
 * GET /api/v1/payment/history?page=1&limit=50
 */
export async function getTransactionHistory(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { page = '1', limit = '50' } = req.query as Record<string, string>
    const userId = (req.user as any).id

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))

    const result = await paymentService.getTransactionHistory(userId, pageNum, limitNum)

    reply.status(200).send(result)
  } catch (err) {
    throw err
  }
}

/**
 * Initiate withdrawal
 * POST /api/v1/payment/withdrawal
 */
export async function initiateWithdrawal(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = WithdrawalValidator.parse(req.body)
    const userId = (req.user as any).id

    const result = await paymentService.initiateWithdrawal(
      userId,
      body.amount,
      body.provider as PaymentProvider
    )

    logger.info(
      { userId, amount: body.amount, provider: body.provider, transactionId: result.transactionId },
      'Withdrawal initiated'
    )

    reply.status(202).send({
      transactionId: result.transactionId,
      status: result.status,
      amount: body.amount,
      provider: body.provider,
    })
  } catch (err) {
    throw err
  }
}

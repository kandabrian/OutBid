/**
 * Payment module routes
 * Handles payment initiation, webhooks, and transaction status
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  initiateStripeIntent,
  handleStripeWebhook,
  initiateMpesaDeposit,
  handlePaystackWebhook,
  initiateCryptoDeposit,
  getPaymentStatus,
  getTransactionHistory,
  initiateWithdrawal,
} from './payment.controller'

export async function paymentRoutes(app: FastifyInstance) {
  // =========================================================================
  // Stripe Payment Routes
  // =========================================================================

  /**
   * Create Stripe payment intent
   * POST /api/v1/payment/stripe/intent
   * Auth: Required (JWT)
   */
  app.post(
    '/stripe/intent',
    { onRequest: [app.authenticate] },
    initiateStripeIntent
  )

  /**
   * Stripe webhook for charge events
   * POST /api/v1/payment/webhook/stripe
   * Auth: None (webhook signature verification)
   */
  app.post('/webhook/stripe', handleStripeWebhook)

  // =========================================================================
  // M-Pesa Payment Routes (via Paystack)
  // =========================================================================

  /**
   * Initiate M-Pesa deposit
   * POST /api/v1/payment/mpesa/initiate
   * Auth: Required (JWT)
   */
  app.post(
    '/mpesa/initiate',
    { onRequest: [app.authenticate] },
    initiateMpesaDeposit
  )

  /**
   * Paystack webhook for M-Pesa charge events
   * POST /api/v1/payment/webhook/paystack
   * Auth: None (webhook signature verification)
   */
  app.post('/webhook/paystack', handlePaystackWebhook)

  // =========================================================================
  // Crypto Payment Routes (via Thirdweb)
  // =========================================================================

  /**
   * Get deposit wallet address for crypto
   * POST /api/v1/payment/crypto/address
   * Auth: Required (JWT)
   */
  app.post(
    '/crypto/address',
    { onRequest: [app.authenticate] },
    initiateCryptoDeposit
  )

  // =========================================================================
  // Transaction Management Routes
  // =========================================================================

  /**
   * Get payment transaction status
   * GET /api/v1/payment/:transactionId/status
   * Auth: Required (JWT)
   */
  app.get(
    '/:transactionId/status',
    { onRequest: [app.authenticate] },
    getPaymentStatus
  )

  /**
   * Get transaction history with pagination
   * GET /api/v1/payment/history?page=1&limit=50
   * Auth: Required (JWT)
   */
  app.get(
    '/history',
    { onRequest: [app.authenticate] },
    getTransactionHistory
  )

  /**
   * Initiate withdrawal
   * POST /api/v1/payment/withdrawal
   * Auth: Required (JWT)
   */
  app.post(
    '/withdrawal',
    { onRequest: [app.authenticate] },
    initiateWithdrawal
  )
}


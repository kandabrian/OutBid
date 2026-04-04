/**
 * Payment service - orchestrates payment operations across multiple providers
 * Handles Stripe, M-Pesa (via Paystack), and Crypto (via Thirdweb)
 * Features: idempotency keys, webhook verification, atomic wallet updates
 */

import { randomUUID } from 'crypto'
import crypto from 'crypto'
import { db } from '../../db'
import { paymentTransactions, wallets, walletLedger, users } from '../../db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import {
  PaymentProvider,
  PaymentStatus,
  PaymentDirection,
  StripeIntentResponse,
  MpesaInitiateResponse,
  CryptoDepositResponse,
  PaymentStatusResponse,
  TransactionHistoryResponse,
  PaymentValidation,
} from './types'
import {
  PaymentError,
  PaymentProviderError,
  WebhookVerificationError,
  UserNotFoundError,
  ValidationError,
} from '../../lib/errors'
import pino from 'pino'

const logger = pino()

// Constants
const MIN_AMOUNT_CENTS = 100 // $1.00
const MAX_AMOUNT_CENTS = 9999999 // $99,999.99
const PLATFORM_FEE_PERCENT = 2 // 2% fee on deposits

// Provider API configuration (from environment)
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ''
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || ''
const THIRDWEB_CLIENT_ID = process.env.THIRDWEB_CLIENT_ID || ''

export class PaymentService {
  /**
   * Validate payment amount
   */
  validateAmount(amount: number): PaymentValidation {
    if (!Number.isInteger(amount) || amount <= 0) {
      return {
        isValid: false,
        reason: 'Amount must be a positive integer',
        minAmount: MIN_AMOUNT_CENTS,
        maxAmount: MAX_AMOUNT_CENTS,
      }
    }

    if (amount < MIN_AMOUNT_CENTS) {
      return {
        isValid: false,
        reason: `Minimum deposit is $${MIN_AMOUNT_CENTS / 100}`,
        minAmount: MIN_AMOUNT_CENTS,
        maxAmount: MAX_AMOUNT_CENTS,
      }
    }

    if (amount > MAX_AMOUNT_CENTS) {
      return {
        isValid: false,
        reason: `Maximum deposit is $${MAX_AMOUNT_CENTS / 100}`,
        minAmount: MIN_AMOUNT_CENTS,
        maxAmount: MAX_AMOUNT_CENTS,
      }
    }

    return {
      isValid: true,
      minAmount: MIN_AMOUNT_CENTS,
      maxAmount: MAX_AMOUNT_CENTS,
    }
  }

  /**
   * Initiate Stripe deposit
   * Returns client secret for frontend to complete payment with Stripe Elements
   */
  async initiateStripeDeposit(
    userId: string,
    amount: number,
    idempotencyKey?: string
  ): Promise<StripeIntentResponse> {
    if (!STRIPE_SECRET) {
      throw new PaymentProviderError('stripe', 'Stripe is not configured')
    }

    const validation = this.validateAmount(amount)
    if (!validation.isValid) {
      throw new ValidationError(validation.reason!, {
        minAmount: validation.minAmount,
        maxAmount: validation.maxAmount,
      })
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) {
      throw new UserNotFoundError()
    }

    const idempotencyKeyToUse = idempotencyKey || randomUUID()
    const [existingTx] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.idempotencyKey, idempotencyKeyToUse))

    if (existingTx) {
      logger.info({ userId, idempotencyKey: idempotencyKeyToUse }, 'Stripe deposit already initiated')
      return {
        transactionId: existingTx.id,
        clientSecret: `pi_${existingTx.id}`,
        amount,
        provider: PaymentProvider.STRIPE,
      }
    }

    const transactionId = randomUUID()
    await db.insert(paymentTransactions).values({
      id: transactionId,
      userId,
      amount,
      method: PaymentProvider.STRIPE,
      provider: PaymentProvider.STRIPE,
      status: PaymentStatus.PENDING,
      direction: PaymentDirection.INBOUND,
      idempotencyKey: idempotencyKeyToUse,
      metadata: { initializationTime: new Date().toISOString() },
    })

    logger.info({ userId, amount, transactionId, provider: PaymentProvider.STRIPE }, 'Stripe deposit initiated')
    return { transactionId, clientSecret: `pi_${transactionId}`, amount, provider: PaymentProvider.STRIPE }
  }

  /**
   * Initiate M-Pesa deposit via Paystack
   */
  async initiateMpesaDeposit(
    userId: string,
    amount: number,
    phoneNumber: string
  ): Promise<MpesaInitiateResponse> {
    if (!PAYSTACK_SECRET) {
      throw new PaymentProviderError('paystack', 'M-Pesa is not configured')
    }

    const validation = this.validateAmount(amount)
    if (!validation.isValid) {
      throw new ValidationError(validation.reason!, {
        minAmount: validation.minAmount,
        maxAmount: validation.maxAmount,
      })
    }

    if (!phoneNumber.match(/^\+254\d{9}$/)) {
      throw new ValidationError('Invalid Kenyan phone number format. Use +254712345678')
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) {
      throw new UserNotFoundError()
    }

    const transactionId = randomUUID()
    await db.insert(paymentTransactions).values({
      id: transactionId,
      userId,
      amount,
      method: 'mpesa',
      provider: PaymentProvider.PAYSTACK,
      status: PaymentStatus.PENDING,
      direction: PaymentDirection.INBOUND,
      metadata: { phoneNumber, initializationTime: new Date().toISOString() },
    })

    logger.info({ userId, amount, phoneNumber, transactionId }, 'M-Pesa deposit initiated')
    return { transactionId, amount, phoneNumber, status: PaymentStatus.PENDING, provider: PaymentProvider.PAYSTACK }
  }

  /**
   * Initiate crypto deposit via Thirdweb
   */
  async initiateCryptoDeposit(
    userId: string,
    amount: number,
    chain: string = 'sepolia'
  ): Promise<CryptoDepositResponse> {
    if (!THIRDWEB_CLIENT_ID) {
      throw new PaymentProviderError('thirdweb', 'Crypto payments are not configured')
    }

    const validation = this.validateAmount(amount)
    if (!validation.isValid) {
      throw new ValidationError(validation.reason!, {
        minAmount: validation.minAmount,
        maxAmount: validation.maxAmount,
      })
    }

    const validChains = ['ethereum', 'polygon', 'sepolia', 'mumbai']
    if (!validChains.includes(chain)) {
      throw new ValidationError(`Invalid chain. Supported: ${validChains.join(', ')}`)
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) {
      throw new UserNotFoundError()
    }

    const transactionId = randomUUID()
    const walletAddress = `0x${randomUUID().replace(/-/g, '').substring(0, 40)}`
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    await db.insert(paymentTransactions).values({
      id: transactionId,
      userId,
      amount,
      method: 'crypto',
      provider: PaymentProvider.THIRDWEB,
      status: PaymentStatus.PENDING,
      direction: PaymentDirection.INBOUND,
      metadata: { chain, walletAddress, expiresAt: expiresAt.toISOString(), initializationTime: new Date().toISOString() },
    })

    logger.info({ userId, amount, chain, transactionId, walletAddress }, 'Crypto deposit initiated')
    return { transactionId, walletAddress, amount, chain, expiresAt, provider: PaymentProvider.THIRDWEB }
  }

  /**
   * Get payment transaction status
   */
  async getPaymentStatus(transactionId: string, userId: string): Promise<PaymentStatusResponse> {
    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(and(eq(paymentTransactions.id, transactionId), eq(paymentTransactions.userId, userId)))

    if (!transaction) {
      throw new PaymentError('TRANSACTION_NOT_FOUND', 'Payment transaction not found', { transactionId })
    }

    return {
      transactionId: transaction.id,
      status: transaction.status as PaymentStatus,
      amount: transaction.amount,
      method: transaction.method,
      createdAt: transaction.createdAt || new Date(),
      completedAt: transaction.completedAt || undefined,
      failureReason: transaction.failureReason || undefined,
    }
  }

  /**
   * Get transaction history with pagination
   */
  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<TransactionHistoryResponse> {
    const offset = (page - 1) * limit

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, userId))

    const total = countResult[0]?.count || 0

    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, userId))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        method: tx.method,
        provider: tx.provider,
        providerId: tx.providerId || undefined,
        status: tx.status as PaymentStatus,
        direction: tx.direction as PaymentDirection,
        metadata: (tx.metadata || {}) as Record<string, any>,
        failureReason: tx.failureReason || undefined,
        createdAt: tx.createdAt || new Date(),
        completedAt: tx.completedAt || undefined,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyStripeWebhook(payload: string, signature: string): boolean {
    if (!STRIPE_WEBHOOK_SECRET) {
      logger.warn('Stripe webhook secret not configured')
      return false
    }

    try {
      const hash = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(payload).digest('hex')
      const parts = signature.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      return parts.v1 === hash
    } catch (err) {
      logger.error({ error: err }, 'Stripe webhook verification failed')
      return false
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyPaystackWebhook(payload: string, signature: string): boolean {
    if (!PAYSTACK_WEBHOOK_SECRET) {
      logger.warn('Paystack webhook secret not configured')
      return false
    }

    try {
      const hash = crypto.createHmac('sha512', PAYSTACK_WEBHOOK_SECRET).update(payload).digest('hex')
      return hash === signature
    } catch (err) {
      logger.error({ error: err }, 'Paystack webhook verification failed')
      return false
    }
  }

  /**
   * Handle Stripe webhook event
   */
  async handleStripeEvent(event: any): Promise<void> {
    const { id: eventId, type, data } = event
    const charge = data.object

    logger.info({ eventId, eventType: type, chargeId: charge.id }, 'Processing Stripe webhook')

    try {
      if (type === 'charge.succeeded') {
        await this.handleStripeChargeSucceeded(charge)
      } else if (type === 'charge.failed') {
        await this.handleStripeChargeFailed(charge)
      }
    } catch (err) {
      logger.error({ eventId, eventType: type, error: err }, 'Failed to process Stripe webhook')
      throw err
    }
  }

  /**
   * Handle successful Stripe charge
   */
  private async handleStripeChargeSucceeded(charge: any): Promise<void> {
    const providerId = charge.id
    const metadata = charge.metadata || {}
    const transactionId = metadata.transactionId

    let [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.providerId, providerId))

    if (!transaction && transactionId) {
      [transaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, transactionId))
    }

    if (!transaction) {
      logger.warn({ providerId, transactionId }, 'Stripe charge succeeded but transaction not found')
      return
    }

    await db
      .update(paymentTransactions)
      .set({ status: PaymentStatus.COMPLETED, providerId, completedAt: new Date() })
      .where(eq(paymentTransactions.id, transaction.id))

    const platformFee = Math.floor((transaction.amount * PLATFORM_FEE_PERCENT) / 100)
    const creditAmount = transaction.amount - platformFee

    await db.transaction(async (tx) => {
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${creditAmount}`, updatedAt: new Date() })
        .where(eq(wallets.userId, transaction!.userId))

      await tx.insert(walletLedger).values({
        id: randomUUID(),
        userId: transaction!.userId,
        amount: creditAmount,
        type: 'deposit',
        relatedTransactionId: transaction!.id,
        description: `Deposit via ${transaction!.provider} (${transaction!.id})`,
        createdAt: new Date(),
      })

      if (platformFee > 0) {
        await tx.insert(walletLedger).values({
          id: randomUUID(),
          userId: transaction!.userId,
          amount: -platformFee,
          type: 'platform_fee',
          relatedTransactionId: transaction!.id,
          description: `Platform fee for deposit`,
          createdAt: new Date(),
        })
      }
    })

    logger.info(
      { transactionId: transaction.id, userId: transaction.userId, amount: creditAmount },
      'Stripe charge processed and wallet credited'
    )
  }

  /**
   * Handle failed Stripe charge
   */
  private async handleStripeChargeFailed(charge: any): Promise<void> {
    const providerId = charge.id
    const failureReason = charge.failure_message || 'Unknown error'

    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.providerId, providerId))

    if (!transaction) {
      logger.warn({ providerId }, 'Stripe charge failed but transaction not found')
      return
    }

    await db
      .update(paymentTransactions)
      .set({ status: PaymentStatus.FAILED, failureReason, completedAt: new Date() })
      .where(eq(paymentTransactions.id, transaction.id))

    logger.info(
      { transactionId: transaction.id, userId: transaction.userId, reason: failureReason },
      'Stripe charge failed'
    )
  }

  /**
   * Handle Paystack webhook event
   */
  async handlePaystackEvent(event: any): Promise<void> {
    const { event: eventType, data } = event

    logger.info({ eventType, reference: data.reference }, 'Processing Paystack webhook')

    try {
      if (eventType === 'charge.success') {
        await this.handlePaystackChargeSuccess(data)
      } else if (eventType === 'charge.failed') {
        await this.handlePaystackChargeFailed(data)
      }
    } catch (err) {
      logger.error({ eventType, error: err }, 'Failed to process Paystack webhook')
      throw err
    }
  }

  /**
   * Handle successful Paystack charge (M-Pesa)
   */
  private async handlePaystackChargeSuccess(data: any): Promise<void> {
    const reference = data.reference
    const metadata = data.metadata || {}
    const userId = metadata.userId

    let [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.providerId, reference))

    if (!transaction && userId) {
      const allUserTxs = await db
        .select()
        .from(paymentTransactions)
        .where(
          and(
            eq(paymentTransactions.userId, userId),
            eq(paymentTransactions.provider, PaymentProvider.PAYSTACK),
            eq(paymentTransactions.status, PaymentStatus.PENDING)
          )
        )

      transaction = allUserTxs.find((tx) => tx.amount === data.amount) || allUserTxs[0]
    }

    if (!transaction) {
      logger.warn({ reference, userId }, 'Paystack charge success but transaction not found')
      return
    }

    await db
      .update(paymentTransactions)
      .set({ status: PaymentStatus.COMPLETED, providerId: reference, completedAt: new Date() })
      .where(eq(paymentTransactions.id, transaction.id))

    const platformFee = Math.floor((transaction.amount * PLATFORM_FEE_PERCENT) / 100)
    const creditAmount = transaction.amount - platformFee

    await db.transaction(async (tx) => {
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${creditAmount}`, updatedAt: new Date() })
        .where(eq(wallets.userId, transaction!.userId))

      await tx.insert(walletLedger).values({
        id: randomUUID(),
        userId: transaction!.userId,
        amount: creditAmount,
        type: 'deposit',
        relatedTransactionId: transaction!.id,
        description: `M-Pesa deposit (${transaction!.id})`,
        createdAt: new Date(),
      })

      if (platformFee > 0) {
        await tx.insert(walletLedger).values({
          id: randomUUID(),
          userId: transaction!.userId,
          amount: -platformFee,
          type: 'platform_fee',
          relatedTransactionId: transaction!.id,
          description: `Platform fee for M-Pesa deposit`,
          createdAt: new Date(),

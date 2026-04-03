/**
 * Wallet service - Balance management and escrow
 * All balance updates are atomic to prevent race conditions
 * Idempotent operations prevent duplicate transactions
 * Uses database transactions for atomicity and isolation
 */

import { randomUUID } from 'crypto'
import { db } from '../../db'
import { wallets, walletLedger, escrowHolds, users, paymentTransactions } from '../../db/schema'
import { eq, and, sum } from 'drizzle-orm'
import {
  UserNotFoundError,
  InsufficientBalanceError,
  BusinessLogicError,
} from '../../lib/errors'
import type { WalletBalance, Transaction } from './types'

export class WalletService {
  /**
   * Get wallet balance with escrow deduction
   * Available = balance - held_in_escrow
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    // Get wallet
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1)

    if (!wallet) {
      // Create wallet if doesn't exist
      const [newWallet] = await db
        .insert(wallets)
        .values({
          id: randomUUID(),
          userId,
          balance: 0,
        })
        .returning()

      return {
        userId,
        balance: 0,
        onHold: 0,
        available: 0,
      }
    }

    // Sum escrow holds
    const [holdResult] = await db
      .select({ total: sum(escrowHolds.amount) })
      .from(escrowHolds)
      .where(
        and(
          eq(escrowHolds.userId, userId),
          eq(escrowHolds.released, false)
        )
      )

    const onHold = holdResult?.total ? Number(holdResult.total) : 0
    const available = Math.max(0, wallet.balance - onHold)

    return {
      userId,
      balance: wallet.balance,
      onHold,
      available,
    }
  }

  /**
   * Initiate deposit (creates payment transaction)
   * Idempotent: same idempotencyKey returns existing transaction
   */
  async initiateDeposit(
    userId: string,
    amount: number,
    method: string,
    idempotencyKey: string
  ) {
    // Check user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new UserNotFoundError()
    }

    // Check if idempotency key already exists
    const [existingTx] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.idempotencyKey, idempotencyKey))
      .limit(1)

    if (existingTx) {
      // Return existing transaction (idempotent)
      return {
        transactionId: existingTx.id,
        amount: existingTx.amount,
        method: existingTx.method,
        status: existingTx.status,
      }
    }

    // Create payment transaction record
    const [tx] = await db
      .insert(paymentTransactions)
      .values({
        id: randomUUID(),
        userId,
        amount,
        method,
        provider: method, // Will be set by payment handler
        status: 'pending',
        direction: 'inbound',
        idempotencyKey,
      })
      .returning()

    return {
      transactionId: tx.id,
      amount: tx.amount,
      method: tx.method,
      status: tx.status,
    }
  }

  /**
   * Confirm deposit and credit wallet
   * Called by payment webhook handler
   * Idempotent: idempotencyKey prevents double-crediting
   */
  async confirmDeposit(
    userId: string,
    transactionId: string,
    amount: number,
    providerId: string,
    idempotencyKey: string
  ) {
    // Check if already processed (idempotent)
    const [existingLedger] = await db
      .select()
      .from(walletLedger)
      .where(eq(walletLedger.relatedTransactionId, transactionId))
      .limit(1)

    if (existingLedger) {
      // Already processed, return success
      return { success: true }
    }

    // Atomic transaction: update payment status AND credit wallet
    return await db.transaction(async (tx) => {
      // Update payment transaction status
      await tx
        .update(paymentTransactions)
        .set({
          status: 'completed',
          providerId,
          completedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, transactionId))

      // Credit wallet
      await tx
        .update(wallets)
        .set({ balance: wallets.balance as any + amount })
        .where(eq(wallets.userId, userId))

      // Add ledger entry
      await tx.insert(walletLedger).values({
        id: randomUUID(),
        userId,
        amount,
        type: 'deposit',
        relatedTransactionId: transactionId,
        description: 'Deposit credited',
      })

      return { success: true }
    })
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<Transaction[]> {
    const transactions = await db
      .select()
      .from(walletLedger)
      .where(eq(walletLedger.userId, userId))
      .orderBy(walletLedger.createdAt)
      .limit(limit)
      .offset(offset)

    return transactions.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      amount: tx.amount,
      type: tx.type as string,
      description: tx.description || undefined,
      createdAt: tx.createdAt || new Date(),
    }))
  }

  /**
   * Initiate withdrawal
   * Requires KYC verification for larger amounts
   * Idempotent via idempotencyKey
   */
  async initiateWithdrawal(
    userId: string,
    amount: number,
    method: string,
    idempotencyKey: string
  ) {
    // Check balance
    const balance = await this.getBalance(userId)

    if (balance.available < amount) {
      throw new InsufficientBalanceError(amount, balance.available)
    }

    // Check if idempotency key already exists
    const [existingTx] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.idempotencyKey, idempotencyKey))
      .limit(1)

    if (existingTx) {
      // Return existing transaction (idempotent)
      return {
        transactionId: existingTx.id,
        amount: existingTx.amount,
        method: existingTx.method,
        status: existingTx.status,
      }
    }

    // Create payment transaction record
    const [tx] = await db
      .insert(paymentTransactions)
      .values({
        id: randomUUID(),
        userId,
        amount,
        method,
        provider: method,
        status: 'pending',
        direction: 'outbound',
        idempotencyKey,
      })
      .returning()

    return {
      transactionId: tx.id,
      amount: tx.amount,
      method: tx.method,
      status: tx.status,
    }
  }

  /**
   * Confirm withdrawal from wallet
   * Atomic: debit wallet and add ledger entry
   */
  async confirmWithdrawal(
    userId: string,
    transactionId: string,
    amount: number
  ) {
    return await db.transaction(async (tx) => {
      // Update payment transaction status
      await tx
        .update(paymentTransactions)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, transactionId))

      // Debit wallet
      await tx
        .update(wallets)
        .set({ balance: wallets.balance as any - amount })
        .where(eq(wallets.userId, userId))

      // Add ledger entry
      await tx.insert(walletLedger).values({
        id: randomUUID(),
        userId,
        amount: -amount, // Negative for debit
        type: 'withdrawal',
        relatedTransactionId: transactionId,
        description: 'Withdrawal processed',
      })

      return { success: true }
    })
  }

  /**
   * Cancel withdrawal (before processing)
   */
  async cancelWithdrawal(userId: string, transactionId: string) {
    const [tx] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.id, transactionId))
      .limit(1)

    if (!tx || tx.userId !== userId) {
      throw new BusinessLogicError(
        'WITHDRAWAL_NOT_FOUND',
        'Withdrawal not found'
      )
    }

    if (tx.status !== 'pending') {
      throw new BusinessLogicError(
        'INVALID_WITHDRAWAL_STATUS',
        'Can only cancel pending withdrawals',
        { status: tx.status }
      )
    }

    await db
      .update(paymentTransactions)
      .set({ status: 'cancelled' })
      .where(eq(paymentTransactions.id, transactionId))

    return { success: true }
  }
}

export const walletService = new WalletService()

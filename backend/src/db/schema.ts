import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  jsonb,
} from 'drizzle-orm/pg-core'

// ============================================================================
// Core Tables
// ============================================================================

/**
 * Users table - stores user accounts (authenticated and guest)
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  username: varchar('username', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  isGuest: boolean('is_guest').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

/**
 * Refresh tokens table - stores valid JWT refresh tokens for session management
 * Tokens are invalidated on logout or after expiry
 */
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

/**
 * Matches table - represents a competitive game session
 * Status flow: waiting → active → completed
 */
export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  player1Id: uuid('player1_id')
    .notNull()
    .references(() => users.id),
  player2Id: uuid('player2_id').references(() => users.id),
  winnerId: uuid('winner_id').references(() => users.id),
  entryFee: integer('entry_fee').notNull(), // in cents
  status: varchar('status', { length: 50 }).default('waiting').notNull(),
  roomToken: varchar('room_token', { length: 255 }).unique(), // signed token for room access
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

/**
 * Wallets table - user account balance
 * Real-time balance = balance - escrow_holds.sum(amount)
 */
export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').default(0).notNull(), // in cents
  updatedAt: timestamp('updated_at').defaultNow(),
})

/**
 * Escrow holds table - temporary balance locks for active matches
 * When player joins match, entry fee is held in escrow
 * Released when match completes or cancelled
 */
export const escrowHolds = pgTable('escrow_holds', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  amount: integer('amount').notNull(), // in cents
  released: boolean('released').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  releasedAt: timestamp('released_at'),
})

// ============================================================================
// Financial Tables
// ============================================================================

/**
 * Wallet ledger - immutable transaction log
 * Used for auditing, reconciliation, and computing balance
 * Real balance = ledger.sum(amount) per user
 */
export const walletLedger = pgTable('wallet_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  amount: integer('amount').notNull(), // positive or negative, in cents
  type: varchar('type', { length: 50 }).notNull(), // deposit, withdrawal, match_win, match_loss, payout, refund, etc.
  relatedMatchId: uuid('related_match_id').references(() => matches.id),
  relatedTransactionId: uuid('related_transaction_id'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

/**
 * Payment transactions - Stripe, M-Pesa, Crypto, etc.
 * Tracks all external payment events
 */
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  amount: integer('amount').notNull(), // in cents
  method: varchar('method', { length: 50 }).notNull(), // stripe, mpesa, crypto
  provider: varchar('provider', { length: 50 }).notNull(), // provider name
  providerId: varchar('provider_id', { length: 255 }), // transaction ID from provider
  status: varchar('status', { length: 50 }).notNull(), // pending, completed, failed, cancelled
  direction: varchar('direction', { length: 20 }).notNull(), // inbound (deposit), outbound (withdrawal)
  idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(), // prevent duplicate processing
  metadata: jsonb('metadata'), // provider-specific data
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
})

/**
 * Audit logs - immutable record of sensitive operations
 * Used for compliance, fraud detection, and debugging
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // user_registered, payment_initiated, match_started, etc.
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // user, match, payment, wallet
  resourceId: uuid('resource_id'),
  details: jsonb('details'), // contextual data
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
})

/**
 * Rate limit tracking - for API rate limiting
 * Expires old records periodically
 */
export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  resetAt: timestamp('reset_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

/**
 * Sessions - for multi-device session management
 * Allows users to see and revoke active sessions
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  deviceName: varchar('device_name', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

/**
 * Webhooks log - for debugging external service integrations
 * Stores all inbound webhook events for audit trail
 */
export const webhooksLog = pgTable('webhooks_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: varchar('provider', { length: 50 }).notNull(), // stripe, paystack, etc.
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  processed: boolean('processed').default(false).notNull(),
  processedAt: timestamp('processed_at'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
})

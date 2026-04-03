import { pgTable, uuid, varchar, integer, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  username: varchar('username', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  isGuest: boolean('is_guest').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  player1Id: uuid('player1_id').references(() => users.id),
  player2Id: uuid('player2_id').references(() => users.id),
  winnerId: uuid('winner_id').references(() => users.id),
  entryFee: integer('entry_fee').notNull(),
  status: varchar('status', { length: 50 }).default('waiting'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  balance: integer('balance').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const escrowHolds = pgTable('escrow_holds', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').references(() => matches.id),
  userId: uuid('user_id').references(() => users.id),
  amount: integer('amount').notNull(),
  released: boolean('released').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

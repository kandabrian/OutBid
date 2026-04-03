/**
 * Zod validators for common patterns
 * Reused across all modules
 */

import { z } from 'zod'

// Email validation
export const emailSchema = z.string().email('Invalid email address')

// Username validation (3-30 chars, alphanumeric + underscore)
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

// Password validation (8+ chars, must have upper, lower, number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Amount validation (positive integer, cents)
export const amountSchema = z
  .number()
  .positive('Amount must be positive')
  .int('Amount must be an integer (in cents)')
  .max(99999999, 'Amount exceeds maximum')

// Entry fee (in cents, $1-$10000)
export const entryFeeSchema = z
  .number()
  .int('Entry fee must be in cents')
  .min(100, 'Entry fee must be at least $1.00')
  .max(1000000, 'Entry fee cannot exceed $10,000')

// Pagination
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// Auth request schemas
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required'),
})

export const passwordResetSchema = z.object({
  email: emailSchema,
})

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  newPassword: passwordSchema,
})

// Match schemas
export const createMatchSchema = z.object({
  entryFee: entryFeeSchema,
  maxPlayers: z.number().int().min(2).max(2).default(2),
})

export const placeBidSchema = z.object({
  matchId: uuidSchema,
  amount: amountSchema,
  nonce: z.string().optional(), // For preventing replay attacks
})

// Wallet schemas
export const depositInitiateSchema = z.object({
  amount: amountSchema,
  method: z.enum(['stripe', 'mpesa', 'crypto']),
  idempotencyKey: z.string().min(1), // Prevent duplicate deposits
})

export const withdrawalSchema = z.object({
  amount: amountSchema,
  method: z.enum(['stripe', 'mpesa', 'crypto']),
  paymentMethodId: z.string().optional(), // Saved method ID
  idempotencyKey: z.string().min(1),
})

// User profile
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateMatchInput = z.infer<typeof createMatchSchema>
export type PlaceBidInput = z.infer<typeof placeBidSchema>
export type DepositInitiateInput = z.infer<typeof depositInitiateSchema>
export type WithdrawalInput = z.infer<typeof withdrawalSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

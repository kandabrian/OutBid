/**
 * Payment module types and constants
 */

// ============================================================================
// Enums
// ============================================================================

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYSTACK = 'paystack', // M-Pesa integration
  THIRDWEB = 'thirdweb', // Crypto
}

export enum PaymentDirection {
  INBOUND = 'inbound',  // Deposit
  OUTBOUND = 'outbound', // Withdrawal
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// ============================================================================
// Request DTOs
// ============================================================================

export interface StripeIntentRequest {
  amount: number // in cents
}

export interface MpesaInitiateRequest {
  amount: number // in cents
  phoneNumber: string // Format: +254712345678
}

export interface CryptoDepositRequest {
  amount: number // in cents
  chain?: string // 'ethereum', 'polygon', 'sepolia' (testnet)
}

export interface StripeWebhookRequest {
  id: string
  object: string
  created: number
  data: {
    object: StripeChargeObject
  }
  type: string
  request?: {
    id: string | null
  }
}

export interface StripeChargeObject {
  id: string
  object: string
  amount: number
  amount_captured: number
  amount_refunded: number
  currency: string
  customer: string | null
  description?: string
  paid: boolean
  receipt_email?: string
  receipt_number?: string
  refunded: boolean
  status: string
  metadata?: Record<string, string>
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface StripeIntentResponse {
  transactionId: string
  clientSecret: string // For Stripe Elements on frontend
  amount: number
  provider: string
}

export interface MpesaInitiateResponse {
  transactionId: string
  amount: number
  phoneNumber: string
  status: PaymentStatus
  provider: string
}

export interface CryptoDepositResponse {
  transactionId: string
  walletAddress: string
  amount: number
  chain: string
  expiresAt: Date
  provider: string
}

export interface PaymentTransaction {
  id: string
  userId: string
  amount: number // in cents
  method: string // 'stripe', 'mpesa', 'crypto'
  provider: string
  providerId?: string // External transaction ID
  status: PaymentStatus
  direction: PaymentDirection
  metadata?: Record<string, any>
  failureReason?: string
  createdAt: Date
  completedAt?: Date
}

export interface PaymentStatusResponse {
  transactionId: string
  status: PaymentStatus
  amount: number
  method: string
  createdAt: Date
  completedAt?: Date
  failureReason?: string
}

export interface TransactionHistoryResponse {
  transactions: PaymentTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ============================================================================
// Webhook Payloads
// ============================================================================

export interface WebhookPayload {
  provider: string
  eventType: string
  data: any
  signature?: string
}

export interface PaystackWebhookPayload {
  event: string
  data: {
    reference: string
    amount: number
    currency: string
    status: string
    customer: {
      customer_code: string
      email: string
      phone?: string
    }
    metadata?: {
      userId?: string
      idempotencyKey?: string
    }
  }
}

// ============================================================================
// Provider-Specific Types
// ============================================================================

export interface StripeConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
}

export interface PaystackConfig {
  secretKey: string
  publicKey: string
  webhookSecret: string
}

export interface ThirdwebConfig {
  clientId: string
  chainId: number // 1 (mainnet), 137 (polygon), 11155111 (sepolia)
}

// ============================================================================
// Internal Types
// ============================================================================

export interface PaymentValidation {
  isValid: boolean
  reason?: string
  minAmount: number
  maxAmount: number
}

export interface ProviderBalance {
  available: number
  pending: number
}

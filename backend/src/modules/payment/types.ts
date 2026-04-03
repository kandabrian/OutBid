/**
 * Payment module types and constants
 */

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYSTACK = 'paystack', // M-Pesa integration
  THIRDWEB = 'thirdweb', // Crypto
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface StripeIntentRequest {
  amount: number
  currency?: string
}

export interface MpesaInitiateRequest {
  amount: number
  phoneNumber: string
}

export interface CryptoDepositRequest {
  amount: number
  chain?: string
}

export interface WebhookPayload {
  provider: string
  eventType: string
  data: any
}

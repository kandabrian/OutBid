# Payment Module

Multi-provider payment processing with Stripe, M-Pesa (Paystack), and Crypto (Thirdweb) integration. Features idempotency, atomic wallet updates, and comprehensive webhook handling.

## Overview

The Payment module enables users to deposit and withdraw funds using three payment methods:
- **Stripe** - Card payments (Visa, Mastercard, Amex)
- **M-Pesa** - Mobile money for Kenya via Paystack
- **Crypto** - Blockchain deposits (Ethereum, Polygon, testnet chains)

All deposits include a **2% platform fee** which is deducted from the transferred amount.

## Architecture

```
payment/
├── types.ts               - TypeScript interfaces (Payment, Transaction, Webhook)
├── payment.service.ts     - Core business logic (deposits, withdrawals, webhooks)
├── payment.controller.ts  - HTTP request handlers
├── payment.routes.ts      - Route registration
└── README.md              - Documentation

Key Features:
- Idempotency keys prevent duplicate charge processing
- Atomic database transactions ensure consistency
- Webhook signature verification for security
- Platform fee calculation and ledger tracking
```

## Core Concepts

### Idempotency Keys

Prevent duplicate charges if the same request is submitted multiple times (network retries, frontend double-clicks, etc.):

```typescript
// Client sends: POST /api/v1/payment/stripe/intent
// With header: Idempotency-Key: a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p

// If network fails and client retries with same key:
// Server returns the same transactionId and clientSecret (doesn't double-charge)
```

### Atomic Wallet Updates

All deposit/withdrawal operations use database transactions:

```typescript
await db.transaction(async (tx) => {
  // 1. Update payment transaction status
  // 2. Update wallet balance
  // 3. Record ledger entries (deposit + platform fee)
  // Either all succeed or all rollback - no partial updates
})
```

### Webhook Verification

Each provider uses HMAC signature verification:

```typescript
// Stripe uses HMAC-SHA256
const hash = crypto.createHmac('sha256', STRIPE_SECRET).update(payload).digest('hex')

// Paystack uses HMAC-SHA512
const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(payload).digest('hex')
```

## HTTP API

### Stripe Payments

#### 1. Create Payment Intent

```http
POST /api/v1/payment/stripe/intent
Authorization: Bearer {token}
Content-Type: application/json
Idempotency-Key: {uuid}

{
  "amount": 50000  // $500.00 in cents
}
```

**Response (201 Created):**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "clientSecret": "pi_550e8400e29b41d4a716446655440000",
  "amount": 50000,
  "provider": "stripe"
}
```

**Frontend Usage:**
```javascript
// Use clientSecret with Stripe.js Elements
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
})
```

#### 2. Stripe Webhook

```http
POST /api/v1/payment/webhook/stripe
Content-Type: application/json
stripe-signature: t=timestamp,v1=signature_hash

{ "type": "charge.succeeded", "data": { "object": {...} } }
```

**Events Handled:**
- `charge.succeeded` - Payment confirmed, wallet credited
- `charge.failed` - Payment rejected, user notified

### M-Pesa Payments

#### 1. Initiate STK Push

```http
POST /api/v1/payment/mpesa/initiate
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50000,              // $500.00 in cents
  "phoneNumber": "+254712345678" // Kenyan number
}
```

**Response (201 Created):**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "phoneNumber": "+254712345678",
  "status": "pending",
  "provider": "paystack"
}
```

**User Experience:**
1. User receives STK push on phone
2. User enters M-Pesa PIN
3. Paystack webhook confirms payment
4. OutBid wallet credited automatically

#### 2. Paystack Webhook

```http
POST /api/v1/payment/webhook/paystack
Content-Type: application/json
x-paystack-signature: signature_hash

{ "event": "charge.success", "data": {...} }
```

### Crypto Deposits

#### 1. Generate Deposit Address

```http
POST /api/v1/payment/crypto/address
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50000,        // $500.00 in cents
  "chain": "sepolia"      // ethereum | polygon | sepolia | mumbai
}
```

**Response (201 Created):**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "amount": 50000,
  "chain": "sepolia",
  "expiresAt": "2026-04-04T11:00:00Z",
  "provider": "thirdweb"
}
```

**User Experience:**
1. User scans QR code or copies address
2. User sends crypto from external wallet
3. Transaction requires 3 blockchain confirmations
4. Crypto converted to USD and wallet credited
5. Conversion rate locked at deposit time

### Transaction Status & History

#### Check Payment Status

```http
GET /api/v1/payment/:transactionId/status
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "amount": 50000,
  "method": "stripe",
  "createdAt": "2026-04-04T10:00:00Z",
  "completedAt": "2026-04-04T10:00:15Z"
}
```

#### Get Transaction History

```http
GET /api/v1/payment/history?page=1&limit=50
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-1",
      "amount": 50000,
      "method": "stripe",
      "provider": "stripe",
      "status": "completed",
      "direction": "inbound",
      "createdAt": "2026-04-04T10:00:00Z",
      "completedAt": "2026-04-04T10:00:15Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 145,
    "pages": 3
  }
}
```

### Withdrawals

#### Initiate Withdrawal

```http
POST /api/v1/payment/withdrawal
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50000,      // $500.00 in cents
  "provider": "stripe"  // stripe | mpesa | crypto
}
```

**Response (202 Accepted):**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "amount": 50000,
  "provider": "stripe"
}
```

**Processing Flow:**
1. Wallet balance immediately deducted (funds held)
2. Withdrawal transaction created with `processing` status
3. Backend initiates payout to user's payment method
4. Webhook from provider confirms completion
5. Transaction marked `completed` or `failed`

## Webhook Signatures

### Stripe

**Headers:**
```
stripe-signature: t=1614556800,v1=hash_value
```

**Verification:**
```typescript
const hash = crypto
  .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
  .update(rawPayload)  // Must be raw request body
  .digest('hex')

// Extract v1 from signature header
const v1 = signature.split(',').find(s => s.startsWith('v1='))?.split('=')[1]
return v1 === hash
```

**Environment Variable:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### Paystack

**Headers:**
```
x-paystack-signature: hash_value
```

**Verification:**
```typescript
const hash = crypto
  .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
  .update(rawPayload)
  .digest('hex')

return hash === signature
```

**Environment Variable:**
```bash
PAYSTACK_WEBHOOK_SECRET=your_secret_key
```

### Crypto (Thirdweb)

Blockchain-based deposits are verified by monitoring the wallet address for incoming transactions. No webhook needed - background job polls blockchain.

## Testing

### Stripe Test Mode

Set environment to use Stripe test keys:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Require Auth: `4000 0025 0000 3155`

**Test Webhook:**
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/v1/payment/webhook/stripe

# Trigger test charge
stripe trigger charge.succeeded
```

### Paystack Test Mode

```bash
PAYSTACK_SECRET_KEY=sk_test_...
```

**Test Phone Number:**
```
+254712345678
```

**Webhook Testing:**
Use Postman or curl to simulate Paystack webhook:

```bash
curl -X POST http://localhost:3000/api/v1/payment/webhook/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: signature_hash" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "ref_123",
      "amount": 50000,
      "customer": { "email": "user@example.com" }
    }
  }'
```

### Crypto Test Mode

Use Sepolia testnet (Ethereum tesnet):

```bash
THIRDWEB_CLIENT_ID=your_client_id
```

Get testnet ETH from faucet:
1. Metamask → Sepolia network
2. Go to https://sepoliafaucet.com
3. Paste wallet address and request ETH

## Data Models

### PaymentTransaction

```typescript
{
  id: string                          // UUID
  userId: string                      // User making payment
  amount: number                      // In cents
  method: 'stripe' | 'mpesa' | 'crypto'
  provider: 'stripe' | 'paystack' | 'thirdweb'
  providerId?: string                 // External transaction ID
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  direction: 'inbound' | 'outbound'
  idempotencyKey?: string             // Prevent duplicates
  metadata: {                         // Provider-specific data
    initializationTime: string
    phoneNumber?: string              // M-Pesa
    chain?: string                    // Crypto
    walletAddress?: string            // Crypto
  }
  failureReason?: string
  createdAt: Date
  completedAt?: Date
}
```

### Wallet Ledger Entry

```typescript
{
  id: string
  userId: string
  amount: number              // Positive or negative
  type: 'deposit' | 'withdrawal' | 'platform_fee' | ...
  relatedTransactionId: string
  description: string
  createdAt: Date
}
```

## Security Considerations

### 1. Webhook Signature Verification
- All webhooks verified before processing
- Unsigned webhooks rejected with 401
- Prevents man-in-the-middle attacks

### 2. Idempotency Keys
- Duplicate requests return same response
- Prevents double-charging on network failures
- Stored in payment_transactions table

### 3. Atomic Transactions
- Wallet balance updates only after payment confirmed
- Platform fee ledger entry ensures audit trail
- No partial updates possible

### 4. Rate Limiting
- Payment endpoints limited to 10 requests/minute per user
- Prevents brute force and API abuse

### 5. Amount Validation
- Min: $1.00 (100 cents)
- Max: $99,999.99 (9999999 cents)
- Prevents unrealistic transactions

### 6. Ledger Immutability
- wallet_ledger is append-only
- No updates allowed, only inserts
- Enables audit and reconciliation

## Error Handling

```javascript
// Network failure - retry is safe with idempotency key
try {
  const response = await initiatePayment(amount, idempotencyKey)
} catch (err) {
  if (err.status === 500 || err.status === 503) {
    // Safe to retry with same idempotency key
  }
}

// Insufficient balance
// Status: 402 Payment Required
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient wallet balance for withdrawal",
    "details": { "required": 50000, "available": 30000 }
  }
}

// Provider error (Stripe down, M-Pesa API error, etc)
// Status: 502 Bad Gateway
{
  "error": {
    "code": "STRIPE_ERROR",
    "message": "Failed to create payment intent",
    "details": { "provider": "stripe", "reason": "API timeout" }
  }
}
```

## Deployment Checklist

- [ ] Set all environment variables (`STRIPE_SECRET_KEY`, `PAYSTACK_SECRET_KEY`, etc)
- [ ] Configure webhook endpoints in each provider's dashboard
- [ ] Set up error alerting for failed webhooks
- [ ] Enable database transaction logging for audits
- [ ] Configure rate limiting based on expected load
- [ ] Set up monitoring for webhook processing latency
- [ ] Document admin procedures for refunds/disputes
- [ ] Test full end-to-end payment flow in staging

## Future Enhancements

- [ ] Manual refund API for customer support
- [ ] Partial refunds for match disputes
- [ ] Payment method tokenization (save card for 1-click)
- [ ] 3D Secure for high-risk transactions
- [ ] Apple Pay / Google Pay integration
- [ ] Currency conversion for international users
- [ ] Invoice/receipt generation
- [ ] Payment reconciliation reports
- [ ] Chargeback dispute resolution workflow

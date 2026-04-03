# OutBid Backend - Phase 1 Implementation Guide

## Status: Scaffolding Complete ✓

All module structures, types, and foundational code are in place. This guide walks through the actual implementation work remaining for Phase 1.

---

## What's Been Scaffolded

✅ **Project Structure**
- Module-based architecture (auth, user, match, wallet, payment, socket)
- Shared utilities (validators, error handling, logging)
- Database schema with all required tables
- Fastify app setup with middleware integration

✅ **Documentation**
- Implementation plan (BACKEND_IMPLEMENTATION_PLAN.md)
- Architecture overview (backend/README.md)
- Auth module guide (src/modules/auth/README.md)
- Environment variables template (.env.example)

✅ **Code Scaffolds**
- Service layer stubs (with TODO comments)
- Controller/route skeletons
- Type definitions for all modules
- Error handling framework
- Validation schemas (Zod)

---

## Phase 1: Core Backend Implementation (8-10 days)

### Week 1: Auth & Database Foundation

#### Day 1-2: Auth Module (Complete Implementation)

**File: `src/modules/auth/auth.service.ts`**

- [x] Password hashing with bcryptjs
- [ ] Register user flow
- [ ] Login flow with JWT generation
- [ ] Guest session creation
- [ ] Refresh token management
- [ ] Token revocation on logout

**Checklist:**
```typescript
// AuthService class needs:
✓ hashPassword(password: string): Promise<string>
✓ comparePassword(password: string, hash: string): Promise<boolean>
✓ register(email, username, password): Promise<User>
✓ login(email, password): Promise<User>
✓ createGuestSession(): Promise<User>
✓ refreshAccessToken(token: string): Promise<User>
✓ revokeRefreshToken(token: string): Promise<void>
✓ getUserById(userId: string): Promise<User>
✓ createRefreshToken(userId: string): Promise<string>
```

**Tests Needed:**
- ✓ Password hashing consistency
- ✓ Password comparison accuracy
- ✓ JWT signature validation
- ✓ Duplicate email detection
- ✓ Invalid password rejection
- ✓ Token expiration handling

**Implementation Tips:**
1. Use Drizzle ORM for all DB queries (parameterized)
2. Hash passwords immediately before storing
3. Validate email format client-side AND server-side
4. Return 401 for invalid credentials (don't leak if email exists)
5. Store refresh tokens in DB for revocation

---

#### Day 2-3: Database Migrations & Setup

**Files to Create:**
- `drizzle/migrations/001_initial_schema.sql`
- Update `drizzle.config.ts` with correct driver

**Steps:**
1. Verify PostgreSQL is running
   ```bash
   psql -U postgres -c "CREATE DATABASE outbid;"
   ```

2. Run migrations
   ```bash
   npm run db:push
   ```

3. Test with Drizzle Studio
   ```bash
   npm run db:studio
   ```

4. Create seed script (optional, for testing)
   ```bash
   # backend/scripts/seed.ts
   ```

**Checklist:**
- [ ] PostgreSQL database created
- [ ] All tables created with correct schema
- [ ] Foreign key constraints working
- [ ] Indexes on frequently queried fields (email, userId, matchId)
- [ ] Timestamps correctly set (defaultNow())

---

#### Day 3-4: Auth Module - HTTP Layer

**File: `src/modules/auth/auth.controller.ts`**

Already scaffolded. Complete implementation:

- [x] registerHandler
- [x] loginHandler
- [x] guestHandler
- [x] refreshAccessTokenHandler
- [x] logoutHandler
- [x] getCurrentUserHandler

**What needs updating:**
- Import authService methods
- Add input validation (registerSchema, loginSchema)
- Handle errors with try-catch (will bubble to global handler)
- Set secure cookies for refresh tokens
- Return proper response types

**Implementation:**
```typescript
export async function registerHandler(
  this: FastifyInstance,
  req: FastifyRequest<{ Body: RegisterRequest }>,
  reply: FastifyReply
) {
  // 1. Validate input with registerSchema.parse()
  // 2. Call authService.register()
  // 3. Generate JWT and refresh token
  // 4. Set refresh token cookie (httpOnly, secure, sameSite)
  // 5. Return AuthResponse with tokens
  // 6. Errors bubble to global error handler
}
```

**Test Cases:**
- Register with valid input → 201 with tokens
- Register duplicate email → 409 conflict
- Register weak password → 400 validation error
- Login valid → 200 with tokens
- Login wrong password → 401
- Guest session → 201 with temporary token

---

### Week 1-2: User & Match Modules

#### Day 5: User Module (Basic Implementation)

**File: `src/modules/user/user.service.ts`**

Scaffold is 80% done. Complete:

- [x] getProfile(userId)
- [ ] updateProfile(userId, updates) – Full implementation
- [ ] getStats(userId) – Aggregate from match/ledger tables
- [ ] getKYCStatus(userId) – Query verification docs

**Key Implementation:**
```typescript
// getStats needs to:
// 1. Query matches table for played/won counts
// 2. Sum earnings from wallet_ledger (type: match_win)
// 3. Calculate win rate percentage
// 4. Get last match date
```

**Database Queries:**
```sql
-- Matches played
SELECT COUNT(*) FROM matches 
WHERE player1_id = $1 OR player2_id = $1

-- Matches won
SELECT COUNT(*) FROM matches 
WHERE winner_id = $1

-- Total earnings
SELECT SUM(amount) FROM wallet_ledger 
WHERE user_id = $1 AND type = 'match_win'

-- Average bid (from ledger for bids placed)
SELECT AVG(amount) FROM wallet_ledger 
WHERE user_id = $1 AND type = 'bid_placed'
```

**Routes to implement:**
- GET /api/v1/users/:id → public profile
- GET /api/v1/users/:id/stats → public stats
- PUT /api/v1/users/me → protected profile update
- POST /api/v1/users/me/verify → protected KYC submission

---

#### Day 6-7: Match Module (Core Logic)

**File: `src/modules/match/match.service.ts`**

This is the most critical module. Scaffold provided. Complete:

- [x] createMatch(player1Id, entryFee)
- [x] joinMatch(matchId, playerId)
- [x] getMatch(matchId)
- [ ] validateAndPlaceBid() – Server validation (critical!)
- [ ] completeMatch() – Payout logic
- [ ] cancelMatch() – Refund logic

**Critical: Server-Authoritative Bid Validation**

This is where "never trust the client" principle applies:

```typescript
async validateAndPlaceBid(
  matchId: string,
  userId: string,
  bidAmount: number
): Promise<Bid> {
  // 1. Verify player is in match
  // 2. Check match status is 'active' (not 'waiting' or 'completed')
  // 3. Verify wallet balance (real balance = balance - escrow_holds.sum)
  // 4. Validate bid amount (positive, reasonable)
  // 5. Store in Redis with match state
  // 6. Return bid record
  
  // NEVER accept bid amount from client without server validation!
  // Client can't modify their own balance or bid amount
}
```

**Match State Flow:**
```
1. CREATE: Player1 creates match (status: waiting)
   - Entry fee locked in escrow
2. JOIN: Player2 joins (status: waiting → active)
   - Player2 entry fee locked in escrow
   - Bid submission phase starts
3. BIDDING: Both players place bids (timeout: 3 min)
   - Bids stored in Redis (not revealed yet)
4. REVEAL: Timer expires, reveal bids
   - Send bid amounts to clients
5. COMPLETE: Determine winner, transfer funds
   - Winner gets loser's entry fee
   - Release escrow holds
   - Log to wallet_ledger

Alternative: Manual reveal after timer
- Both players click "reveal bids"
- When both revealed, show results
```

**Database queries needed:**
```typescript
// Check wallet balance (available = balance - holds)
const wallet = await db.select().from(wallets).where(eq(wallets.userId, userId))
const holds = await db.select({ sum: sum(escrowHolds.amount) })
  .from(escrowHolds)
  .where(and(eq(escrowHolds.userId, userId), eq(escrowHolds.released, false)))

// Create match and escrow hold
await db.insert(matches).values({ ... })
await db.insert(escrowHolds).values({ ... })

// Complete match and transfer funds
// This is ATOMIC (use transaction):
await db.transaction(async (tx) => {
  // 1. Update match status
  // 2. Release loser's escrow, deduct from balance
  // 3. Release winner's escrow, add loser's fee
  // 4. Add ledger entries for both players
})
```

---

### Week 2: Wallet & Escrow

#### Day 8: Wallet Module (Balance & Escrow)

**File: `src/modules/wallet/wallet.service.ts`**

Implementation mostly stubbed. Complete:

- [x] getBalance() – Return balance, onHold, available
- [ ] initiateDeposit() – Create payment transaction record
- [ ] confirmDeposit() – Credit wallet from payment webhook
- [ ] initiateWithdrawal() – Verify balance, create withdrawal record
- [ ] getTransactionHistory() – Query wallet_ledger with pagination

**Key Concept: Escrow Holds**

Available balance = total balance - sum of unreleased escrow holds

```typescript
async getBalance(userId: string): Promise<WalletBalance> {
  // Get wallet
  const wallet = await db.select().from(wallets)
    .where(eq(wallets.userId, userId))
  
  // Sum escrow holds
  const [holdResult] = await db.select({ total: sum(escrowHolds.amount) })
    .from(escrowHolds)
    .where(and(
      eq(escrowHolds.userId, userId),
      eq(escrowHolds.released, false)
    ))
  
  return {
    balance: wallet.balance,
    onHold: holdResult.total || 0,
    available: wallet.balance - onHold
  }
}
```

**Idempotency Pattern**

Prevent duplicate deposits/withdrawals:

```typescript
// Each deposit/withdrawal has unique idempotencyKey
// Check if already processed before creating new transaction

const existing = await db.select()
  .from(paymentTransactions)
  .where(eq(paymentTransactions.idempotencyKey, key))

if (existing.length > 0) {
  return existing[0] // Return already-processed transaction
}

// New transaction
const [tx] = await db.insert(paymentTransactions).values({ ... })
```

---

#### Day 9: Escrow & Payout Logic

**Create: `src/modules/wallet/escrow.service.ts`**

```typescript
export class EscrowService {
  // Place hold when player joins match
  async placeHold(matchId: string, userId: string, amount: number)
  
  // Release hold and complete payout
  async releaseAndPayout(
    matchId: string,
    winnerId: string,
    loserId: string,
    amount: number
  )
  
  // Cancel match and refund all holds
  async cancelAndRefund(matchId: string)
}
```

**Atomic Payout Transaction:**

```typescript
async releaseAndPayout(matchId, winnerId, loserId, entryFee) {
  await db.transaction(async (tx) => {
    // 1. Release both escrow holds
    await tx.update(escrowHolds)
      .set({ released: true, releasedAt: new Date() })
      .where(and(
        eq(escrowHolds.matchId, matchId),
        eq(escrowHolds.released, false)
      ))
    
    // 2. Update balances
    await tx.update(wallets)
      .set({ balance: sql`balance + ${entryFee}` })
      .where(eq(wallets.userId, winnerId))
    
    await tx.update(wallets)
      .set({ balance: sql`balance - ${entryFee}` })
      .where(eq(wallets.userId, loserId))
    
    // 3. Add ledger entries
    await tx.insert(walletLedger).values([
      {
        userId: winnerId,
        amount: entryFee,
        type: 'match_win',
        relatedMatchId: matchId,
      },
      {
        userId: loserId,
        amount: -entryFee,
        type: 'match_loss',
        relatedMatchId: matchId,
      }
    ])
  })
}
```

---

### Week 2-3: Payment Integration Setup

#### Day 10: Payment Module Skeleton

**Files:**
- `src/modules/payment/payment.service.ts`
- `src/modules/payment/stripe.provider.ts` (create)
- `src/modules/payment/mpesa.provider.ts` (create)
- `src/modules/payment/crypto.provider.ts` (create)
- `src/modules/payment/webhook.handler.ts` (create)

**Stripe Provider** (`stripe.provider.ts`)

```typescript
export class StripeProvider {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  
  async createPaymentIntent(amount: number, currency = 'usd') {
    // Create Stripe payment intent
    // Return clientSecret for frontend
  }
  
  async confirmPayment(paymentIntentId: string) {
    // Verify payment was successful
  }
  
  verifyWebhookSignature(body: string, signature: string): boolean {
    // Use Stripe SDK to verify
  }
  
  async handleWebhookEvent(event: Stripe.Event) {
    // Handle charge.succeeded, charge.failed, etc.
  }
}
```

**Paystack/M-Pesa Provider** (`mpesa.provider.ts`)

```typescript
export class PaystackProvider {
  async initiateMpesaSTKPush(phoneNumber: string, amount: number) {
    // Call Paystack API to initiate STK push
    // User enters M-Pesa PIN on phone
    // Return checkout URL
  }
  
  async verifyTransaction(reference: string) {
    // Check transaction status with Paystack
  }
  
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Compute HMAC-SHA512
  }
}
```

**Crypto Provider** (`crypto.provider.ts`)

```typescript
export class ThirdwebProvider {
  async createDepositWallet(userId: string) {
    // Create Thirdweb wallet
    // Return address for user to send crypto to
  }
  
  async checkBalance(walletAddress: string) {
    // Poll blockchain for received funds
  }
  
  async handleWebhook(event: any) {
    // Handle blockchain confirmation
  }
}
```

---

## Testing Strategy During Implementation

### After Each Module:

1. **Unit Tests** (`src/modules/auth/__tests__/auth.service.test.ts`)
   ```bash
   npm test
   ```

2. **Manual API Testing** (use curl or Postman)
   ```bash
   # Register
   curl -X POST http://localhost:4000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","username":"testuser","password":"TestPass123"}'
   
   # Login
   curl -X POST http://localhost:4000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"TestPass123"}'
   ```

3. **Protected Route Testing**
   ```bash
   # Get current user
   curl -X GET http://localhost:4000/api/v1/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### Integration Tests

Create test file per module:
```typescript
// src/modules/auth/__tests__/auth.integration.test.ts

describe('Auth Flow', () => {
  test('Register → Login → Get Profile', async () => {
    // 1. Register user
    // 2. Verify user created in DB
    // 3. Login with credentials
    // 4. Get JWT token
    // 5. Call protected route with token
    // 6. Verify can access profile
  })
})
```

---

## Common Pitfalls & How to Avoid

### 1. Race Conditions in Balance Updates
**Problem:** Two concurrent bids/payments both deduct balance before checking

**Solution:**
- Use database transactions with SERIALIZABLE isolation
- Drizzle: `await db.transaction(async (tx) => { ... })`
- Always check balance INSIDE transaction

### 2. Passwords in Logs
**Problem:** Password hashes or plaintext in error messages

**Solution:**
- Never log password or hash
- Log only: "Password hashing failed" (no details)
- Use structured logging (pino) with sanitization

### 3. JWT Secret in Code
**Problem:** Hardcoded JWT secret in source

**Solution:**
- Always use `process.env.JWT_SECRET`
- Validate exists on app startup
- Minimum 32 characters for production

### 4. Missing Input Validation
**Problem:** Accept any input from client

**Solution:**
- Validate ALL user input with Zod
- Use `.parse()` (throws) or `.safeParse()` (returns result)
- Custom Zod schemas in `lib/validators.ts`

### 5. Escrow Holds Not Released
**Problem:** User's funds stuck after match completes

**Solution:**
- Always release holds in same transaction as payout
- Set `released: true, releasedAt: now()`
- Reconciliation job to fix orphaned holds (weekly)

---

## Quick Reference: File Changes Checklist

### Auth Module
- [ ] `auth.service.ts` – Implement all service methods
- [ ] `auth.controller.ts` – Wire up service to HTTP handlers ✓
- [ ] `auth.routes.ts` – Add route registration ✓
- [ ] `auth.middleware.ts` – JWT verification ✓

### User Module
- [ ] `user.service.ts` – Implement getStats
- [ ] `user.routes.ts` – Create all endpoints
- [ ] `user.controller.ts` – Create handlers

### Match Module
- [ ] `match.service.ts` – Complete all methods
- [ ] `match.routes.ts` – Wire up routes
- [ ] `match.controller.ts` – Create handlers
- [ ] `match.validators.ts` – Add Zod schemas

### Wallet Module
- [ ] `wallet.service.ts` – Complete implementation
- [ ] `escrow.service.ts` – Create escrow logic
- [ ] `wallet.routes.ts` – Wire up routes
- [ ] `wallet.controller.ts` – Create handlers

### Database
- [ ] Run migrations: `npm run db:push`
- [ ] Verify tables in Drizzle Studio
- [ ] Add indexes on hot columns

---

## Environment & Deployment Checklist

Before running locally:

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env
# Edit .env with local PostgreSQL/Redis URLs

# 3. Start PostgreSQL
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Docker: docker run -p 5432:5432 postgres:16

# 4. Start Redis
# macOS: brew services start redis
# Linux: redis-server
# Docker: docker run -p 6379:6379 redis:7

# 5. Create database
psql -U postgres -c "CREATE DATABASE outbid;"

# 6. Run migrations
npm run db:push

# 7. Start dev server
npm run dev
```

---

## Next: Phase 2 (Real-time & Payments)

Once Phase 1 is complete:

1. **Socket.io Real-time** (3-4 days)
   - Implement bid submission handlers
   - Match state synchronization
   - Reveal phase timing
   - Reconnection logic

2. **Payment Integration** (4-5 days)
   - Stripe API integration
   - Paystack/M-Pesa STK push
   - Webhook handling
   - Idempotent confirmation

3. **Advanced Features** (2-3 days)
   - Rate-limiting middleware
   - Audit logging
   - Admin endpoints
   - Monitoring/Sentry setup

---

## Questions?

Refer to:
- `BACKEND_IMPLEMENTATION_PLAN.md` – Overall strategy
- `backend/README.md` – Architecture overview
- `src/modules/auth/README.md` – Auth flow details
- Individual module `README.md` files (create as needed)

---

*Status: Ready for Phase 1 Implementation*
*Estimated Duration: 8-10 working days*
*Next Milestone: Auth & Database Foundation (Day 1-4)*

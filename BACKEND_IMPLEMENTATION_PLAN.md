# OutBid Backend Implementation Plan

## Overview
Production-ready backend for a real-time competitive bidding game with secure escrow, multiple payment methods, and WebSocket real-time gameplay.

**Tech Stack:**
- Runtime: Node.js + TypeScript
- Framework: Fastify 5.x
- DB: PostgreSQL 16 (Drizzle ORM)
- Cache/PubSub: Redis 7.x (ioredis)
- Real-time: Socket.io 4.x
- Auth: JWT + bcryptjs
- Validation: Zod
- Testing: Vitest + Playwright (Phase 3)

---

## Phase 1: Secure Backend Core (API v1)

### Architecture Principles
1. **API Versioning:** All routes prefixed with `/api/v1/`
2. **Server-Authoritative:** Never trust client bid logic; validate all game actions server-side
3. **Security-First:** Input validation (Zod), rate-limiting, signed tokens, idempotent payments
4. **Modularity:** Feature-based modules with clear separation of concerns
5. **Scalability:** Redis for ephemeral state, async job queue for long-running operations
6. **Audit Logging:** All financial transactions logged with immutable records

### Module Breakdown

#### 1. **Auth Module** (`src/modules/auth/`)
**Purpose:** Secure user authentication and session management

**Features:**
- User registration (email/username validation, password hashing)
- Email verification (optional for MVP)
- Login with JWT token generation
- Guest session creation (anonymous play)
- Password reset flow (token-based)
- Social login placeholders (Google, etc.)
- Refresh token rotation

**Endpoints (v1):**
```
POST   /api/v1/auth/register       → Register new user
POST   /api/v1/auth/login          → Login & get JWT
POST   /api/v1/auth/guest          → Create guest session
POST   /api/v1/auth/refresh        → Refresh JWT token
POST   /api/v1/auth/logout         → Invalidate session
POST   /api/v1/auth/password-reset → Request password reset
PUT    /api/v1/auth/password       → Reset password with token
```

**Files:**
- `types.ts` – Request/response types
- `auth.controller.ts` – HTTP handlers
- `auth.service.ts` – Business logic (hash, JWT, DB ops)
- `auth.routes.ts` – Fastify route registration
- `auth.middleware.ts` – JWT verification, guard functions
- `README.md` – Security notes

**Security Considerations:**
- Passwords hashed with bcryptjs (min 10 rounds)
- JWT signed with HS256 + secure secret (env var)
- Refresh tokens stored in secure HTTP-only cookies
- Rate-limiting on login/register (5 attempts/15 min)
- Email validation before registration
- Guest sessions expire after 24h or match end

---

#### 2. **User Module** (`src/modules/user/`)
**Purpose:** User profiles, stats, and account management

**Features:**
- User profile retrieval/update
- Player statistics (matches played, win rate, total earnings)
- KYC/verification status (for payment features)
- User preferences (notification settings, etc.)
- Avatar/profile picture upload placeholder

**Endpoints:**
```
GET    /api/v1/users/:id           → Get user profile
PUT    /api/v1/users/:id           → Update profile
GET    /api/v1/users/:id/stats     → Get player stats
POST   /api/v1/users/:id/verify    → Submit KYC docs (placeholder)
GET    /api/v1/users/me            → Get authenticated user info
```

**Files:**
- `types.ts`
- `user.controller.ts`
- `user.service.ts`
- `user.routes.ts`
- `README.md`

**Security Considerations:**
- Only authenticated users can access profiles
- Users can only update own profile (except admins)
- KYC verification gated by payment amount thresholds
- Stats are read-only (computed from matches)

---

#### 3. **Match Module** (`src/modules/match/`)
**Purpose:** Game room/lobby management, server-authoritative bid validation

**Features:**
- Create match lobby (set entry fee, players)
- Join match room
- Server-side bid validation (no client manipulation)
- Match state machine (waiting → active → completed)
- Timeout handling (auto-resolve bids)
- Match history retrieval
- Webhook notifications on match completion

**Endpoints:**
```
POST   /api/v1/matches              → Create match room
GET    /api/v1/matches/:id          → Get match details
POST   /api/v1/matches/:id/join     → Join match
GET    /api/v1/matches/:id/bids     → Get current bids (only for participants)
POST   /api/v1/matches/:id/cancel   → Cancel match
GET    /api/v1/matches/user/:id     → Get user's match history
GET    /api/v1/matches/lobby        → List active lobbies
```

**WebSocket Events:**
```
match:created        → New match available (lobby)
match:joined         → Player joined (update UI)
bid:placed           → New bid received
bid:revealed         → Bid phase complete, results shown
match:completed      → Winner determined, payout processing
match:error          → Validation/timeout error
```

**Files:**
- `types.ts` – Match state, bid, room types
- `match.controller.ts`
- `match.service.ts` – Room state, validation logic
- `match.routes.ts`
- `match.validators.ts` – Zod schemas
- `README.md`

**Security Considerations:**
- **Server-Authoritative Validation:** All bid amounts checked server-side against wallet balance
- **Signed Room Tokens:** Players receive signed JWT to join room (prevents unauthorized access)
- **Immutable Bid Records:** Bids stored in DB before reveal phase
- **Timeout Enforcement:** Server tracks match duration, auto-resolves if timeout
- **Entry Fee Lock:** Escrow hold placed before match starts
- **No Cheating Prevention:** Client can't modify bid during reveal

---

#### 4. **Wallet/Escrow Module** (`src/modules/wallet/`)
**Purpose:** Balance management, escrow holds, atomic transaction handling

**Features:**
- Get wallet balance
- Deposit funds (via payment module)
- Withdraw funds (with KYC check)
- Escrow hold placement (when joining match)
- Escrow release (on match completion)
- Atomic balance updates (no race conditions)
- Transaction history

**Endpoints:**
```
GET    /api/v1/wallet/balance      → Get wallet balance
POST   /api/v1/wallet/deposit      → Initiate deposit
POST   /api/v1/wallet/withdraw     → Request withdrawal
GET    /api/v1/wallet/transactions → Get transaction history
GET    /api/v1/wallet/holds        → Get active escrow holds
```

**Files:**
- `types.ts`
- `wallet.controller.ts`
- `wallet.service.ts` – Ledger logic, escrow management
- `wallet.routes.ts`
- `escrow.service.ts` – Escrow-specific logic
- `README.md`

**Security Considerations:**
- **Atomic Transactions:** Database-level locks prevent double-spending
- **Idempotent Deposits:** Deposits have unique `idempotency_key` to prevent duplicates
- **Escrow Isolation:** Held funds not counted as available balance
- **Audit Trail:** Every transaction logged with timestamp, user, amount, reason
- **Withdrawal Limits:** Daily/monthly limits based on KYC tier
- **Negative Balance Prevention:** Validation before escrow placement

---

#### 5. **Payment Module** (`src/modules/payment/`)
**Purpose:** Multi-provider payment processing with secure webhook handling

**Features:**
- Deposit via Stripe (credit card)
- Deposit via M-Pesa (mobile money, via Paystack sandbox)
- Deposit via Crypto (via Thirdweb, testnet for MVP)
- Withdrawal to original payment method
- Webhook handling for payment status updates
- Reconciliation & settlement
- PCI compliance placeholders

**Endpoints:**
```
POST   /api/v1/payment/stripe/intent           → Create Stripe payment intent
POST   /api/v1/payment/stripe/confirm          → Confirm payment (webhook)
POST   /api/v1/payment/mpesa/initiate          → Initiate M-Pesa STK push
POST   /api/v1/payment/mpesa/callback          → M-Pesa webhook
POST   /api/v1/payment/crypto/address          → Get Thirdweb wallet
POST   /api/v1/payment/webhook/stripe          → Stripe events
POST   /api/v1/payment/webhook/paystack        → Paystack events
GET    /api/v1/payment/methods                 → List saved payment methods
```

**Files:**
- `types.ts` – Payment provider types, transaction status
- `payment.controller.ts`
- `payment.service.ts` – High-level payment flow
- `stripe.provider.ts` – Stripe API integration
- `mpesa.provider.ts` – M-Pesa via Paystack sandbox
- `crypto.provider.ts` – Thirdweb integration
- `webhook.handler.ts` – Process provider callbacks
- `payment.routes.ts`
- `README.md`

**Security Considerations:**
- **API Keys:** Stored in env vars, never logged
- **Webhook Verification:** Cryptographic signature validation on all webhooks
- **Idempotency:** Webhook processing is idempotent (handles retries)
- **PII Handling:** No sensitive payment data stored in DB (only provider IDs)
- **Rate-Limiting:** Strict limits on deposit/withdrawal attempts
- **Sandbox Mode:** Dev env uses sandbox credentials, production uses live
- **Timeout Handling:** Pending payments marked as "expired" after 30 min

---

#### 6. **WebSocket/Socket.io Module** (`src/socket/`)
**Purpose:** Real-time game room communication

**Features:**
- Real-time match event streaming
- Bid placement (validated server-side)
- Live player updates
- Redis pub/sub for multi-server scaling
- Room management (join/leave)
- Automatic reconnection & state sync
- Connection throttling to prevent abuse

**Events (Server sends):**
```
match:state         → Full match state (on join/sync)
player:joined       → New player joined
bid:placed          → Bid placed by opponent (if in reveal phase)
bid:revealed        → Reveal phase complete, all bids shown
match:completed     → Match finished, winner announced
match:error         → Validation error (e.g., insufficient balance)
user:status         → Player online/offline
```

**Events (Server receives):**
```
bid:submit          → Client places bid (validated server)
match:ready         → Client confirms ready to play
match:leave         → Client leaves match
sync:request        → Request full state (after reconnect)
```

**Files:**
- `index.ts` – Socket.io server setup
- `middleware/auth.middleware.ts` – Socket auth
- `handlers/bid.handler.ts` – Bid event processing
- `handlers/match.handler.ts` – Match events
- `handlers/room.handler.ts` – Room management
- `services/room.service.ts` – Redis room state
- `README.md`

**Security Considerations:**
- **Socket Authentication:** JWT verified on connection
- **Room Authorization:** Players can only join own match room
- **Server-Side Bid Validation:** All bids validated before broadcast
- **Rate-Limiting:** Max 10 bids/second per user
- **Redis Pub/Sub:** Enables multi-server real-time sync
- **Graceful Disconnection:** State preserved for 30s reconnection window
- **No Private Match State:** Reveal bids only after timer expires

---

#### 7. **Shared Utilities & Middleware** (`src/lib/` & `src/middleware/`)

**Middleware:**
- `auth.middleware.ts` – JWT verification & user context
- `errorHandler.ts` – Global error catching & formatting
- `logger.ts` – Request/response logging
- `rateLimit.ts` – Redis-backed rate limiting
- `audit.middleware.ts` – Log sensitive operations

**Utilities:**
- `validators.ts` – Zod schemas (reusable)
- `errors.ts` – Custom error classes
- `crypto.ts` – JWT, token generation
- `redis.ts` – Redis client & helpers
- `db.ts` – Database client & transactions
- `idempotency.ts` – Idempotency key handling
- `types.ts` – Shared TypeScript types

**Features:**
- Global error handler with proper HTTP status codes
- Request ID tracing (uuid per request)
- Structured JSON logging
- Rate-limiting by endpoint/user/IP
- Input validation pipelines
- Audit log persistence
- Database transaction helpers
- Idempotent operation support

---

### Database Schema (Extended)

```sql
-- Core tables (already defined)
users
matches
wallets
escrow_holds

-- Additional tables needed:
payment_transactions    -- All payment events
wallet_ledger          -- Immutable transaction log
audit_logs             -- Sensitive operation audit trail
refresh_tokens         -- JWT refresh token storage
rate_limits            -- Rate limit tracking
sessions               -- Session management
email_verifications    -- Email verification tokens
password_resets        -- Password reset tokens
saved_payment_methods  -- Saved Stripe/M-Pesa cards
webhooks_log           -- Webhook event log (for debugging)
```

---

### API Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "User-friendly message",
    "details": {
      "required": 1000,
      "available": 500
    },
    "requestId": "req_12345"
  }
}
```

**Standard HTTP Status Codes:**
- `200 OK` – Success
- `201 Created` – Resource created
- `400 Bad Request` – Validation error (Zod)
- `401 Unauthorized` – Missing/invalid JWT
- `403 Forbidden` – Permission denied
- `409 Conflict` – Business logic conflict (e.g., match already started)
- `429 Too Many Requests` – Rate limited
- `500 Internal Server Error` – Server error
- `503 Service Unavailable` – External provider down

---

### Environment Variables

```bash
# App
PORT=4000
NODE_ENV=development
API_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/outbid

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# CORS
CLIENT_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack (M-Pesa)
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=...

# Thirdweb
THIRDWEB_SECRET_KEY=...
THIRDWEB_CLIENT_ID=...

# Email (for password reset, verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## Phase 2: Frontend Integration

**High-level flow (details in separate doc):**

1. **Wallet View:** Display balance, deposit/withdraw forms
2. **Lobby View:** List available matches, create/join buttons
3. **Match Room:** Live bid submission, opponent bids (post-reveal)
4. **Results:** Winner display, payout confirmation
5. **History:** Past matches, earnings, stats

**Frontend integration points:**
- `/api/v1/auth/*` – Login/register/guest flows
- `/api/v1/wallet/*` – Balance display, deposit initiation
- `/api/v1/matches/*` – Lobby list, match creation, history
- `/socket` – Real-time bid updates, match state sync
- `/api/v1/payment/*` – Payment provider redirects (Stripe, Paystack)

---

## Phase 3: Testing & Deployment

**Testing Strategy:**
- Unit tests (Vitest): Services, validators, utilities
- Integration tests: API endpoints, DB operations
- E2E tests (Playwright): Full user flows (auth → match → payout)
- Load testing: Redis pub/sub under 1000+ concurrent users

**CI/CD Pipeline:**
- GitHub Actions: Run tests on PR, lint code, type-check
- Automated deployment: Merge to main → deploy backend

**Deployment:**
- Backend: Railway/Render (auto-scaling, env var management)
- Frontend: Vercel (auto-deploy on push)
- Database: Managed PostgreSQL (Railway/AWS RDS)
- Redis: Managed Redis (Redis Cloud/AWS ElastiCache)

---

## Implementation Roadmap (Sequential)

### Week 1: Foundation & Auth
1. Set up project structure, Zod validators, error handling middleware
2. Implement Auth module (register, login, JWT, guest)
3. Create User module with basic CRUD
4. Set up testing framework

### Week 2: Wallet & Escrow
1. Implement Wallet module (balance, transactions)
2. Implement Escrow module (holds, releases)
3. Set up audit logging
4. Add idempotency for payments

### Week 3: Match Logic
1. Implement Match module (create, join, state machine)
2. Add server-authoritative bid validation
3. Implement match completion & payout logic
4. Add room timeout handling

### Week 4: Payment Integration
1. Stripe integration (payment intent flow)
2. Paystack/M-Pesa integration (STK push, callback)
3. Thirdweb crypto integration (testnet)
4. Webhook handling & reconciliation

### Week 5: Real-time
1. Set up Socket.io with Redis pub/sub
2. Implement room management & connection auth
3. Implement bid event handlers
4. Test with 100+ concurrent connections

### Week 6: Polish & Testing
1. Add comprehensive error handling
2. E2E tests for critical flows
3. Load testing & optimization
4. Security audit (OWASP, rate-limiting, injection prevention)

### Week 7-8: Deployment
1. CI/CD pipeline setup
2. Deploy to staging environment
3. Performance monitoring (Sentry, DataDog)
4. Production deployment & monitoring

---

## Security Checklist

- [ ] All passwords hashed with bcryptjs (min 10 rounds)
- [ ] JWT secrets strong (32+ chars), stored in env only
- [ ] Database connections use SSL
- [ ] All input validated with Zod schemas
- [ ] Rate-limiting on auth, payment, match creation endpoints
- [ ] CORS properly configured (whitelist CLIENT_URL)
- [ ] SQL injection prevention (Drizzle ORM parameterized queries)
- [ ] XSS prevention (JWT tokens in HTTP-only cookies)
- [ ] CSRF protection on state-changing endpoints
- [ ] Webhooks verified with cryptographic signatures
- [ ] API rate-limiting per user/IP (Redis-backed)
- [ ] Sensitive data never logged (passwords, tokens, card numbers)
- [ ] Audit logs for all financial transactions
- [ ] Session invalidation on logout
- [ ] Idempotent payment processing (duplicate detection)
- [ ] Escrow holds prevent negative balance
- [ ] Match validation prevents unauthorized winners
- [ ] Socket.io connections require JWT auth
- [ ] Room tokens prevent cross-room access
- [ ] Environment variables never committed
- [ ] Error messages don't leak sensitive info

---

## Next Steps

1. **Immediate (Today):**
   - Review this plan with team
   - Set up `.env.example` with all required vars
   - Verify PostgreSQL & Redis running locally

2. **Day 1-2:**
   - Scaffold project structure with all modules
   - Create base types, validators, error handlers
   - Implement Auth module

3. **Day 3-4:**
   - Implement User & Wallet modules
   - Set up database migrations

4. **Day 5+:**
   - Match module with server-authoritative validation
   - Payment integrations
   - Real-time Socket.io

---

## Questions for Clarification

1. Should we implement email verification before launch, or assume trusted emails?
2. Do you want audit logs queryable via API (for compliance), or only internal?
3. For MVP, should we start with Stripe only, or all three payment methods upfront?
4. What's the maximum match timeout? (suggest 10 min)
5. Should we implement match betting odds/multipliers, or simple winner-take-all?
6. Do you need admin panel for moderating disputes/refunds?

---

## Module READMEs Template

Each module will have a `README.md` documenting:
1. **Purpose** – What the module does
2. **API Endpoints** – Detailed request/response examples
3. **Database Schema** – Tables involved, relationships
4. **Security Considerations** – Specific threats & mitigations
5. **Error Codes** – Custom error codes the module returns
6. **Testing** – Unit test examples
7. **Deployment** – Env vars, configuration
8. **Troubleshooting** – Common issues & solutions

---

*This plan is comprehensive, modular, and production-ready. Each module is self-contained yet integrates seamlessly. Security is baked in at every layer.*

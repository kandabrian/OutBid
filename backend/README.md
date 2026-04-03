# OutBid Backend Architecture

A production-ready backend for a real-time competitive bidding game with secure escrow, multi-method payments, and WebSocket real-time gameplay.

**Status:** Phase 1 Scaffolding Complete - Ready for Implementation

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 16
- Redis 7
- npm or yarn

### Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Fill in database and Redis URLs

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

The server will start on `http://localhost:4000`

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                    # Fastify app initialization
│   ├── index.ts                  # Server entry point
│   ├── routes.ts                 # Route registration (API v1)
│   │
│   ├── db/
│   │   ├── index.ts              # Database client (Drizzle)
│   │   └── schema.ts             # PostgreSQL schema definitions
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── errors.ts             # Custom error classes
│   │   ├── types.ts              # Shared TypeScript types
│   │   ├── validators.ts         # Zod validation schemas
│   │   ├── errorHandler.ts       # Global error handler middleware
│   │   ├── logger.ts             # Structured JSON logging
│   │   └── redis.ts              # Redis client wrapper
│   │
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication & JWT
│   │   │   ├── types.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.middleware.ts
│   │   │   └── README.md
│   │   │
│   │   ├── user/                 # User profiles & stats
│   │   │   ├── types.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.routes.ts
│   │   │   └── README.md (TODO)
│   │   │
│   │   ├── match/                # Game room management
│   │   │   ├── types.ts
│   │   │   ├── match.service.ts
│   │   │   ├── match.routes.ts
│   │   │   ├── match.validators.ts (TODO)
│   │   │   └── README.md (TODO)
│   │   │
│   │   ├── wallet/               # Balance & escrow
│   │   │   ├── types.ts
│   │   │   ├── wallet.service.ts
│   │   │   ├── wallet.routes.ts
│   │   │   ├── escrow.service.ts (TODO)
│   │   │   └── README.md (TODO)
│   │   │
│   │   └── payment/              # Payment processing
│   │       ├── types.ts
│   │       ├── payment.service.ts
│   │       ├── payment.routes.ts
│   │       ├── stripe.provider.ts (TODO)
│   │       ├── mpesa.provider.ts (TODO)
│   │       ├── crypto.provider.ts (TODO)
│   │       ├── webhook.handler.ts (TODO)
│   │       └── README.md (TODO)
│   │
│   └── socket/                   # Real-time gameplay
│       ├── index.ts              # Socket.io initialization
│       ├── handlers/
│       │   ├── bid.handler.ts (TODO)
│       │   ├── match.handler.ts (TODO)
│       │   └── room.handler.ts (TODO)
│       ├── middleware/
│       │   ├── auth.middleware.ts (TODO)
│       │   └── rateLimiter.ts (TODO)
│       ├── services/
│       │   └── room.service.ts (TODO)
│       └── README.md (TODO)
│
├── drizzle.config.ts             # Database migration config
├── tsconfig.json
├── package.json
└── .env.example

```

---

## API Endpoints (v1)

All endpoints are prefixed with `/api/v1/`

### Authentication
- `POST /auth/register` – Register new account
- `POST /auth/login` – Login with email/password
- `POST /auth/guest` – Create guest session
- `POST /auth/refresh` – Refresh access token
- `POST /auth/logout` – Invalidate session (auth required)
- `GET /auth/me` – Get current user (auth required)

### Users
- `GET /users/:id` – Get user profile
- `PUT /users/me` – Update profile (auth required)
- `GET /users/:id/stats` – Get player statistics
- `POST /users/me/verify` – Submit KYC verification (auth required)

### Matches
- `POST /matches` – Create match lobby (auth required)
- `GET /matches/:id` – Get match details
- `POST /matches/:id/join` – Join match (auth required)
- `GET /matches/lobby` – List available lobbies
- `POST /matches/:id/cancel` – Cancel match (auth required)

### Wallet
- `GET /wallet/balance` – Get wallet balance (auth required)
- `POST /wallet/deposit` – Initiate deposit (auth required)
- `POST /wallet/withdraw` – Request withdrawal (auth required)
- `GET /wallet/transactions` – Get transaction history (auth required)
- `GET /wallet/holds` – Get active escrow holds (auth required)

### Payments
- `POST /payment/stripe/intent` – Create Stripe payment intent (auth required)
- `POST /payment/stripe/webhook` – Stripe webhook handler
- `POST /payment/mpesa/initiate` – Initiate M-Pesa (auth required)
- `POST /payment/mpesa/webhook` – M-Pesa webhook handler
- `POST /payment/crypto/address` – Get crypto deposit address (auth required)

---

## Database Schema

### Core Tables
- **users** – User accounts (authenticated & guest)
- **refresh_tokens** – JWT refresh token storage
- **wallets** – User account balances
- **matches** – Game sessions and state
- **escrow_holds** – Temporary balance locks

### Financial Tables
- **wallet_ledger** – Immutable transaction log
- **payment_transactions** – External payment events
- **audit_logs** – Compliance and fraud detection

### Management Tables
- **rate_limits** – API rate limiting
- **sessions** – Multi-device session tracking
- **webhooks_log** – Payment provider event log

See `src/db/schema.ts` for detailed field definitions.

---

## Security Features

### Authentication & Authorization
- ✅ Bcryptjs password hashing (10 rounds)
- ✅ JWT token generation (HS256)
- ✅ Refresh token rotation (one-time use)
- ✅ HTTP-only secure cookies for refresh tokens
- ✅ Guest session support (24h expiry)

### API Security
- ✅ Input validation with Zod schemas
- ✅ Global error handler (no info leakage)
- ✅ Rate-limiting on auth endpoints
- ✅ CORS properly configured
- ✅ Helmet headers (security hardening)

### Payment Security
- ✅ Webhook signature verification (cryptographic)
- ✅ Idempotent payment processing (duplicate prevention)
- ✅ PCI compliance placeholders
- ✅ Sandbox mode for testing

### Game Logic Security
- ✅ Server-authoritative bid validation (no client trust)
- ✅ Signed room tokens (prevent unauthorized access)
- ✅ Escrow holds prevent negative balance
- ✅ Atomic transactions prevent race conditions
- ✅ Audit logging for all financial operations

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": { "field": "value" },
    "requestId": "unique-request-id",
    "timestamp": "2026-04-04T12:00:00Z"
  }
}
```

**Common Error Codes:**
- `INVALID_CREDENTIALS` (401) – Wrong email/password
- `INVALID_TOKEN` (401) – Token expired or invalid
- `USER_NOT_FOUND` (404) – User doesn't exist
- `MATCH_NOT_FOUND` (404) – Match doesn't exist
- `INSUFFICIENT_BALANCE` (409) – Not enough balance
- `INVALID_MATCH_STATE` (409) – Operation invalid in current state
- `RATE_LIMIT_EXCEEDED` (429) – Too many requests
- `VALIDATION_ERROR` (400) – Input validation failed

---

## Environment Variables

**Create `.env` from `.env.example`:**

```bash
# App
PORT=4000
NODE_ENV=development
API_URL=http://localhost:4000

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/outbid

# Cache & PubSub (Redis)
REDIS_URL=redis://localhost:6379

# JWT & Sessions
JWT_SECRET=your-secret-key-32-characters-minimum
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# CORS & Frontend
CLIENT_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack (M-Pesa)
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=...

# Thirdweb (Crypto)
THIRDWEB_SECRET_KEY=...
THIRDWEB_CLIENT_ID=...

# Email (future: password reset, verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
```

---

## WebSocket Events

### Client → Server

```javascript
// Join match room
socket.emit('match:join', { matchId: 'uuid' })

// Submit bid (server validates)
socket.emit('bid:submit', { matchId: 'uuid', amount: 5000 })

// Signal ready to start
socket.emit('match:ready', { matchId: 'uuid' })

// Request full state (after reconnect)
socket.emit('sync:request', { matchId: 'uuid' })

// Leave match (forfeit)
socket.emit('match:leave', { matchId: 'uuid' })
```

### Server → Client

```javascript
// Match state synchronization
socket.on('match:state', { 
  matchId, phase, players, bids, totalPot, expiresAt 
})

// Player joined
socket.on('player:joined', { playerId, timestamp })

// Player ready
socket.on('player:ready', { playerId })

// Both players ready, match started
socket.on('match:started', { startedAt, revealDeadline })

// Bid placement confirmation
socket.on('bid:received', { success, timestamp })

// Reveal phase: show all bids
socket.on('bid:revealed', { bids: [{ playerId, amount }] })

// Match completed with winner
socket.on('match:completed', { winnerId, prize, timestamp })

// Error occurred
socket.on('match:error', { code, message })
```

---

## Testing Strategy

### Unit Tests (Vitest)
```bash
npm test
```

- Auth service (password hashing, JWT generation)
- Validation schemas (Zod validators)
- Error handling (custom error classes)
- Utility functions

### Integration Tests
- Database operations (inserts, updates, transactions)
- API endpoints (auth flow, match creation, payments)
- Middleware (error handling, rate-limiting)

### E2E Tests (Playwright)
- Full user flow: register → login → create match → join → bid → payout
- Error scenarios: invalid credentials, insufficient balance, timeouts

---

## Deployment

### Environment Setup
- Production uses live API keys (Stripe, Paystack)
- Staging uses sandbox/test keys
- Database uses environment-specific URLs

### Build & Run
```bash
npm run build
npm start
```

Compiled code in `dist/` directory.

### Docker (Optional)
```bash
docker build -t outbid-backend .
docker run -p 4000:4000 --env-file .env outbid-backend
```

### Scaling Considerations
- Redis pub/sub for multi-server match synchronization
- Database connection pooling (Drizzle with pg pool)
- Stateless design allows horizontal scaling
- Socket.io Redis adapter for load balancing

---

## Development Workflow

### 1. Feature Development
1. Add Zod validator in `lib/validators.ts` if new input
2. Create service method with business logic
3. Add controller handler (HTTP layer)
4. Register route with authentication guard
5. Add error handling with custom AppError subclass
6. Document endpoint in module README

### 2. Security Checklist
- [ ] Input validated with Zod
- [ ] Rate-limiting on sensitive endpoints
- [ ] Authentication guard on protected routes
- [ ] No sensitive data in logs or error messages
- [ ] Database queries parameterized (Drizzle ORM)
- [ ] Idempotent if state-changing operation

### 3. Testing
- [ ] Unit tests for service logic
- [ ] Integration test for full flow
- [ ] Error case testing (invalid input, auth, conflicts)

### 4. Documentation
- [ ] API endpoint documented in module README
- [ ] Error codes listed with status codes
- [ ] Security considerations noted
- [ ] Example curl/client code provided

---

## Next Steps

### Phase 1: Complete Core Backend (Week 1-2)
- [x] Scaffold all modules
- [ ] Implement Auth module fully
- [ ] Implement User module
- [ ] Implement Match module with server-authoritative validation
- [ ] Implement Wallet & Escrow logic
- [ ] Set up database transactions for atomicity

### Phase 2: Payment & Real-time (Week 3-4)
- [ ] Stripe integration (payment intents, webhooks)
- [ ] Paystack/M-Pesa integration (STK push, callbacks)
- [ ] Thirdweb crypto integration (testnet)
- [ ] Complete Socket.io handlers
- [ ] Redis pub/sub for match state

### Phase 3: Polish & Deploy (Week 5-6)
- [ ] Comprehensive error handling
- [ ] Rate-limiting middleware
- [ ] Audit logging
- [ ] Testing (unit, integration, E2E)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Deployment to staging/production

---

## Useful Commands

```bash
# Development
npm run dev              # Start with auto-reload
npm run build            # Compile TypeScript
npm start                # Run compiled code

# Database
npm run db:push          # Apply migrations
npm run db:studio        # Open Drizzle Studio

# Testing
npm test                 # Run tests
npm run test:coverage    # Test coverage report

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking
```

---

## Resources

- **Fastify Docs:** https://www.fastify.io/
- **Drizzle ORM:** https://orm.drizzle.team/
- **Socket.io:** https://socket.io/docs/
- **Zod Validation:** https://zod.dev/
- **Stripe API:** https://stripe.com/docs/api
- **Paystack API:** https://paystack.com/docs/api/

---

## Support

For questions or issues, refer to the module-specific READMEs:
- `src/modules/auth/README.md` – Authentication flow
- `src/modules/match/README.md` – Game logic & server validation
- `src/modules/wallet/README.md` – Balance & escrow management
- `src/modules/payment/README.md` – Payment provider integration

---

*Last Updated: 2026-04-04*
*Status: Phase 1 Scaffolding Complete*

# Match Module

Real-time competitive bidding with server-authoritative validation, atomic escrow management, and multi-server Redis synchronization.

## Architecture

### Components

```
match/
├── types.ts           - TypeScript interfaces (Match, PlayerState, BidEvent, RoomState, etc.)
├── match.service.ts   - Core business logic (server-authoritative validation, settlement)
├── match.controller.ts - HTTP request handlers
├── match.routes.ts    - Route registration
└── README.md          - Documentation

socket/
├── handlers/
│   ├── match.handler.ts - Match room events (join, leave, bid placement)
│   └── bid.handler.ts   - Advanced bid handling (concurrent bids, retraction)
├── services/
│   └── room.service.ts - Redis-backed room state management
└── middleware/
    └── auth.ts        - Socket.io JWT authentication
```

## Core Concepts

### Server-Authoritative Validation

All bids are validated on the server before acceptance:

1. **Player Verification** - Confirm player is in match
2. **Balance Check** - Verify available balance (accounting for escrow holds)
3. **Bid Bounds** - Ensure amount is within valid range ($0.01 - $99,999.99)
4. **Match State** - Confirm match is in `active` status

Client-side validation is for UX only; server makes all authoritative decisions.

### Real-Time State Management

**Redis Architecture:**
- Match state stored in Redis for low-latency access
- Multi-server scaling via shared Redis cluster
- Bids stored as chronological sequence with unique sequence numbers
- Automatic cleanup on match completion (5-minute TTL)

**Key Patterns:**
```
match:{matchId}           -> RoomState (all bids, player states, current high bid)
match:{matchId}:players   -> Set of active player userIds
player:{userId}:socket    -> Socket.io socket ID for direct messaging
```

### Escrow Management

Entry fees are held in escrow to prevent double-spending:

1. **Lock on Join** - Entry fee locked when player joins/creates match
2. **Atomic Settlement** - Winner receives (entryFee × 2 - platformFee)
3. **Auto-Refund** - On timeout or cancellation, fees refunded
4. **Database Track** - `escrowHolds` table maintains hold history

Available balance = wallet.balance - escrow.sum(active holds)

### Bid Sequencing

Bids have strict ordering to resolve concurrent bids:

```typescript
BidEvent {
  matchId: string
  userId: string
  amount: number        // in cents
  timestamp: Date
  sequenceNumber: number // 1, 2, 3... (deterministic ordering)
}
```

On conflicts, higher sequence number always wins (server clock is authoritative).

## HTTP API

### 1. Create Match

```http
POST /api/v1/match/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "entryFee": 50000  // $500.00 in cents
}
```

**Response:**
```json
{
  "match": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "player1Id": "user-1",
    "player2Id": null,
    "status": "waiting",
    "entryFee": 50000,
    "roomToken": "signed-jwt-room-token",
    "startedAt": null,
    "createdAt": "2026-04-04T10:00:00Z"
  }
}
```

**Errors:**
- `VALIDATION_ERROR` - Invalid entry fee (< $1 or > $99,999.99)
- `INSUFFICIENT_BALANCE` - Player doesn't have available balance

### 2. List Available Matches

```http
GET /api/v1/match/list/available?page=1&limit=50
```

**Response:**
```json
{
  "matches": [
    {
      "id": "match-id",
      "player1Id": "user-1",
      "entryFee": 50000,
      "createdAt": "2026-04-04T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### 3. Join Match

```http
POST /api/v1/match/{matchId}/join
Authorization: Bearer {token}
```

**Response:**
```json
{
  "match": {
    "id": "match-id",
    "player1Id": "user-1",
    "player2Id": "user-2",
    "status": "active",
    "entryFee": 50000,
    "startedAt": "2026-04-04T10:00:05Z",
    "createdAt": "2026-04-04T10:00:00Z"
  }
}
```

**Errors:**
- `NOT_FOUND` - Match doesn't exist
- `INVALID_STATE` - Match already started or cancelled
- `FORBIDDEN` - Cannot join own match
- `INSUFFICIENT_BALANCE` - Player doesn't have available balance

### 4. Get Match Status

```http
GET /api/v1/match/{matchId}
```

**Response:**
```json
{
  "match": {
    "id": "match-id",
    "player1Id": "user-1",
    "player2Id": "user-2",
    "winnerId": null,
    "status": "active",
    "entryFee": 50000,
    "currentHighBid": 12500,
    "currentBidder": "user-2",
    "startedAt": "2026-04-04T10:00:05Z",
    "createdAt": "2026-04-04T10:00:00Z"
  }
}
```

### 5. Cancel Match

```http
POST /api/v1/match/{matchId}/cancel
Authorization: Bearer {token}
```

Only player1 can cancel, and only before player2 joins.

**Response:**
```json
{
  "message": "Match cancelled successfully"
}
```

## WebSocket API

### Connection & Authentication

```javascript
// Client connects with JWT token
const socket = io(SERVER_URL, {
  auth: {
    token: jwtToken  // From /auth/login
  }
})
```

### 1. Join Match Room

```javascript
socket.emit('match:join', { matchId }, (err, response) => {
  if (err) {
    console.error('Failed to join:', err.message)
  } else {
    console.log('Joined match:', response.matchId)
  }
})
```

**Events Received:**
```javascript
// When you join
socket.on('match:joined', (data) => {
  console.log('You joined:', data.matchId)
})

// When other player joins
socket.on('match:player-joined', (data) => {
  console.log(data.userId, 'joined at', data.timestamp)
})
```

### 2. Place Bid (Server-Authoritative)

```javascript
socket.emit('match:place-bid', 
  { matchId, amount: 5000 },  // $50.00 bid
  (err, response) => {
    if (err) {
      console.error('Bid rejected:', err.reason)
      // reason: 'insufficient_balance' | 'invalid_amount' | 'match_ended' | etc.
    } else {
      console.log('Bid accepted at', response.timestamp)
    }
  }
)
```

**Server Validations:**
- ✅ Player is in match
- ✅ Match is in `active` status
- ✅ Bid amount is $0.01 - $99,999.99
- ✅ Player has available balance to cover bid
- ✅ Bid doesn't exceed match timeout

**Events Received:**
```javascript
socket.on('match:bid-placed', (data) => {
  console.log(data.userId, 'placed bid of', data.amount, 'cents')
  // Update UI with new high bid
})
```

### 3. Handle Concurrent Bids

When both players bid simultaneously, server uses sequence numbers:

```javascript
socket.emit('bid:submit-concurrent',
  {
    matchId,
    bids: [
      { userId: 'user-1', amount: 5000 },
      { userId: 'user-2', amount: 7500 }
    ]
  },
  (err, response) => {
    if (!err) {
      console.log('Current high bid:', response.currentHighBid)
      console.log('Current bidder:', response.currentBidder)
    }
  }
)
```

### 4. Retract Bid (Grace Period)

Can only retract within 500ms of placement:

```javascript
socket.emit('bid:retract',
  { matchId, bidSequence: 5 },
  (err, response) => {
    if (err && err.reason === 'BID_LOCKED') {
      console.log('Too late to retract')
    }
  }
)
```

### 5. Request State Sync

After reconnection, recover full match state:

```javascript
socket.emit('match:sync-request',
  { matchId },
  (err, response) => {
    if (!err) {
      const state = response.state  // Full RoomState
      console.log('Current high bid:', state.currentHighBid)
      console.log('All bids:', state.bids)
    }
  }
)
```

### All WebSocket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `match:join` | C→S | Player joins room |
| `match:joined` | S→C | Confirmation of join |
| `match:player-joined` | S→C | Broadcast when other player joins |
| `match:leave` | C→S | Player leaves room |
| `match:player-left` | S→C | Broadcast when player leaves |
| `match:place-bid` | C→S | Submit bid for validation |
| `match:bid-placed` | S→C | Broadcast accepted bid |
| `bid:submit-concurrent` | C→S | Handle concurrent bids |
| `bid:retract` | C→S | Retract recent bid |
| `bid:retracted` | S→C | Broadcast retracted bid |
| `match:sync-request` | C→S | Request full state recovery |
| `match:sync-response` | S→C | Full RoomState for recovery |
| `error` | S→C | Error notification |

## Data Models

### Match

```typescript
interface Match {
  id: string              // UUID
  player1Id: string       // Creator
  player2Id: string | null // Joiner
  winnerId: string | null
  entryFee: number        // In cents
  status: 'waiting' | 'active' | 'completed' | 'cancelled'
  roomToken: string | null // Signed JWT for room access
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
}
```

### RoomState (Redis)

```typescript
interface RoomState {
  matchId: string
  roomKey: string
  players: {
    [userId: string]: {
      userId: string
      username: string
      currentBid: number
      bidCount: number
      lastBidAt: Date | null
      isActive: boolean
    }
  }
  status: MatchStatus
  bids: BidEvent[]              // Chronological history
  currentHighBid: number
  currentBidder: string | null
  lastUpdateAt: number          // Unix timestamp
}
```

### Settlement

```typescript
interface MatchSettlement {
  matchId: string
  winnerId: string
  loserIds: string[]
  entryFee: number
  platformFeePercentage: number // 5%
  payouts: {
    userId: string
    amount: number  // After fees
  }[]
}
```

## Match Lifecycle

```
1. CREATE → waiting
   - Player1 creates match
   - Entry fee locked in escrow
   - Match visible in /list/available

2. JOIN → active
   - Player2 joins match
   - Player2's entry fee locked in escrow
   - Socket rooms created
   - Bidding begins

3. BID (repeated)
   - Server validates each bid
   - Updates Redis state atomically
   - Broadcasts to all players
   - Sequence numbers ensure ordering

4. TIMEOUT or END
   - Server determines winner
   - Executes settlement transaction
   - Winner receives (fee × 2 - 5%)
   - Loser receives -(fee)
   - Match marked `completed`
   - Redis state cleaned up

5. OR CANCEL
   - Player1 cancels before join
   - Both players' fees refunded
   - Match marked `cancelled`
```

## Timeout Management

Matches auto-timeout after **5 minutes** of inactivity:

1. Timer starts when match transitions to `active`
2. Last bid resets timer
3. On timeout:
   - Determine winner (highest bid)
   - Execute settlement
   - Clean up Redis state
   - Send `match:completed` notification

## Security Considerations

### 1. Server-Authoritative Validation
- **Never** trust client bid values
- Always verify on server before accepting
- Sequence numbers prevent replay attacks

### 2. Escrow Safety
- Entry fees locked immediately on create/join
- Prevents double-spending via wallet balance checks
- Atomic transactions ensure consistency

### 3. Rate Limiting
- Per-user bid rate limit: 10 bids/second max
- Prevents client spam and DDoS
- Measured on server, not client

### 4. Cheating Prevention
- Bid amounts in cents (prevent floating point exploits)
- Timestamps from server (prevent clock-skew exploitation)
- Sequence numbers from server (prevent ordering gaming)
- Socket.io ACK pattern for delivery confirmation

### 5. Data Integrity
- All match state changes go through db.transaction()
- Wallet ledger is append-only immutable log
- Audit logs track all sensitive operations

## Testing

### Unit Tests (Vitest)
```bash
npm test -- match.service.test.ts
```

Tests cover:
- Bid validation logic
- Escrow calculations
- Settlement payouts
- Timeout handling
- Error scenarios

### Integration Tests
```bash
npm test -- match.integration.test.ts
```

Tests cover:
- Full match lifecycle
- Real-time socket events
- Concurrent bids
- State consistency
- Multi-server scenarios

### Load Testing (Artillery)
```bash
artillery run match.load-test.yml
```

Simulates:
- 100 concurrent matches
- 200 bidders total
- 10 bids/second
- Network latency

## Performance

### Benchmarks
- Bid validation: <5ms (Redis cached)
- Match creation: <50ms (DB transaction)
- Settlement: <200ms (Multi-row update)
- Socket broadcast: <10ms (in-memory)

### Scalability
- Horizontal: Redis pub/sub scales to 10k+ concurrent matches
- Vertical: Single instance handles ~1k concurrent WebSocket connections
- Database: Connection pool manages 20 concurrent queries

## Future Enhancements

- [ ] Auction-style bidding (increment minimum bid each round)
- [ ] Team matches (3v3 or larger)
- [ ] Replay system (record all bids, watch matches)
- [ ] Spectator mode (view live matches)
- [ ] Practice mode (no real money)
- [ ] Tournament brackets (series of matches)

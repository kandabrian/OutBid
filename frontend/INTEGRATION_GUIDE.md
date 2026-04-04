# Frontend Integration Guide

## Overview

This guide documents the real-time integration hooks and API client setup for OutBid frontend. All components are scaffolded with Socket.io and Zustand state management ready for production.

## Architecture

```
Frontend
├── Components (UI + Game + Pages)
├── Hooks (useSocket, useMatch, useWallet, useAPI)
├── Stores (auth.store, match.store, wallet.store)
├── API Client (api.ts with axios + interceptors)
└── Socket.io (lib/socket.ts with connection pool)
```

## Real-Time Integration

### Socket.io Hooks

#### `useSocket(options?)`

Base hook for Socket.io connection management with auto-reconnection.

```tsx
import { useSocket } from '@/hooks/useSocket'

export default function MyComponent() {
  const socket = useSocket({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onError: (error) => console.error('Socket error', error),
  })

  // Socket is automatically authenticated with user token
  // Connection pooling handled globally
}
```

**Features:**
- Auto-reconnection (exponential backoff: 1s → 5s max, 5 attempts)
- User authentication (token + userId from auth.store)
- Global connection pooling (single socket instance)
- Automatic cleanup on unmount
- Error handling and logging

#### `useMatch(matchId: string | null)`

Real-time match state synchronization with server.

```tsx
import { useMatch } from '@/hooks/useSocket'
import { useMatchStore } from '@/stores/match.store'

export default function MatchGame({ matchId }: { matchId: string }) {
  const { placeBid, joinMatch, leaveMatch } = useMatch(matchId)
  const { players, currentPhase, currentHighBid } = useMatchStore()

  const handleBid = async (amount: number) => {
    try {
      placeBid(amount) // Emits to server
      // Store updates automatically via 'match:bid-placed' event
    } catch (error) {
      console.error('Bid failed:', error)
    }
  }

  return (
    <div>
      <h1>Match {matchId}</h1>
      <p>Phase: {currentPhase.phase}</p>
      <p>High Bid: ${(currentHighBid / 100).toFixed(2)}</p>
      <button onClick={() => handleBid(5000)}>Bid $50</button>
    </div>
  )
}
```

**Socket.io Events:**

Server → Client:
- `match:initialized` - Match created with players
- `match:phase-change` - Phase transition (bidding → reveal → completed)
- `match:bid-placed` - Player bid update (includes amount)
- `match:bid-revealed` - Bid revealed with amount (score calculated)
- `match:completed` - Match finished, winner determined

Client → Server:
- `match:join` - Join a match
- `match:leave` - Leave a match
- `match:place-bid` - Submit a bid amount

#### `useWallet()`

Real-time wallet balance and transaction synchronization.

```tsx
import { useWallet } from '@/hooks/useSocket'
import { useWalletStore } from '@/stores/wallet.store'

export default function WalletPage() {
  const { depositFunds, withdrawFunds, requestKycVerification } = useWallet()
  const { availableBalance, escrowHold, transactions } = useWalletStore()

  const handleDeposit = (amount: number) => {
    depositFunds(amount, 'stripe') // Emits deposit-init event
    // Balance updates automatically via 'wallet:balance-updated'
  }

  return (
    <div>
      <p>Available: ${(availableBalance / 100).toFixed(2)}</p>
      <p>In Escrow: ${(escrowHold / 100).toFixed(2)}</p>
      <button onClick={() => handleDeposit(10000)}>Deposit $100</button>
    </div>
  )
}
```

**Socket.io Events:**

Server → Client:
- `wallet:balance-updated` - Balance changed (available, escrow)
- `wallet:transaction-added` - New transaction recorded
- `wallet:kyc-updated` - KYC tier changed
- `wallet:daily-limit-updated` - Daily limit reset/updated

Client → Server:
- `wallet:deposit-init` - Initialize deposit (amount, provider)
- `wallet:withdraw-init` - Initialize withdrawal (amount, destination)
- `wallet:kyc-request` - Request KYC verification

---

## HTTP API Integration

### API Client Setup

The `api.ts` module provides axios instance with:
- Automatic auth token injection (from Zustand store)
- 401 handling (logout + redirect to login)
- Request/response logging
- 10s timeout

```tsx
import { api, loginUser, getWallet } from '@/lib/api'

// Use provided helpers
const wallet = await getWallet()

// Or make custom requests
const response = await api.get('/custom-endpoint')
const data = response.data
```

### Auth Endpoints

```tsx
import { loginUser, registerUser, verifyToken } from '@/lib/api'

// Login
const user = await loginUser('user@example.com', 'password')
// Returns: { id, username, email, token }

// Register
const user = await registerUser('username', 'user@example.com', 'password')
// Returns: { id, username, email, token }

// Verify token (for session restoration)
const valid = await verifyToken(token)
// Returns: { valid: boolean }
```

### Match Endpoints

```tsx
import { createMatch, joinMatch, getMatch, placeBid, getMatches } from '@/lib/api'

// Create match
const match = await createMatch(1000) // $10 entry fee in cents
// Returns: { id, entryFee, status, players: [...] }

// Join existing match
const match = await joinMatch('match-id-123')
// Returns: { id, entryFee, status, players: [...] }

// Get match details
const match = await getMatch('match-id-123')
// Returns: full match data

// Place bid (HTTP fallback if Socket.io fails)
const result = await placeBid('match-id-123', 5000)
// Returns: { bidAmount, confirmed: true }

// Get matches list
const { matches, total } = await getMatches(page, limit)
```

### Wallet Endpoints

```tsx
import {
  getWallet,
  depositFunds,
  withdrawFunds,
  getTransactions,
} from '@/lib/api'

// Get wallet state
const wallet = await getWallet()
// Returns: { available, escrow, total, kycTier, dailyLimit }

// Deposit (initiates provider flow)
const deposit = await depositFunds(10000, 'stripe')
// Returns: { sessionId, redirectUrl }

// Withdraw
const withdrawal = await withdrawFunds(5000, 'bank-account-123')
// Returns: { id, status, amount, destination }

// Get transaction history
const { transactions, hasMore } = await getTransactions(page, limit)
// Returns: array of transactions with full details
```

### User Endpoints

```tsx
import {
  getProfile,
  updateProfile,
  getLeaderboard,
  getMatchHistory,
} from '@/lib/api'

// Get profile
const profile = await getProfile()
// Returns: { id, username, email, joinDate, badges, stats }

// Update profile
const updated = await updateProfile({ username: 'newname' })
// Returns: updated profile

// Get leaderboard
const { users, hasMore } = await getLeaderboard(page, limit)
// Returns: ranked players with stats

// Get match history
const { matches, hasMore } = await getMatchHistory(page, limit)
// Returns: user's past matches with results
```

---

## Zustand Stores

### auth.store.ts

User authentication state - already exists, properly configured.

```tsx
import { useAuthStore } from '@/stores/auth.store'

const { user, setUser, logout } = useAuthStore()

if (user) {
  console.log(`Logged in as ${user.username}`)
}
```

### match.store.ts (Refactored)

Real-time match state synchronized via Socket.io.

```tsx
import { useMatchStore } from '@/stores/match.store'

const {
  matchId,
  currentPhase,
  players,
  currentHighBid,
  entryFee,
  updateBid,
  revealBid,
  completeMatch,
} = useMatchStore()

// Example: check current phase
if (currentPhase.phase === 'bidding') {
  console.log('Time remaining:', currentPhase.timeRemaining)
}

// Example: check current player's bid
const currentPlayer = players.find(p => p.playerId === userId)
if (currentPlayer?.bidRevealed) {
  console.log(`Your bid was $${currentPlayer.bid / 100}`)
}
```

**State:**
- `matchId: string | null`
- `status: 'waiting' | 'active' | 'completed'`
- `currentPhase: { phase, round, timeRemaining }`
- `players: PlayerInMatch[]`
- `currentHighBid: number`
- `entryFee: number`
- `winnings: number`

### wallet.store.ts (New)

Real-time wallet state synchronized via Socket.io.

```tsx
import { useWalletStore } from '@/stores/wallet.store'

const {
  availableBalance,
  escrowHold,
  totalBalance,
  transactions,
  kycTier,
  updateBalance,
  recordWin,
  recordFee,
} = useWalletStore()

// Example: display balance
console.log(`Available: $${(availableBalance / 100).toFixed(2)}`)

// Example: check if low balance
if (availableBalance < 100) {
  // Show low balance warning
}

// Example: check transaction history
transactions.forEach(tx => {
  console.log(`${tx.type}: $${tx.amount / 100} on ${tx.timestamp}`)
})
```

**State:**
- `availableBalance: number` (cents)
- `escrowHold: number` (cents)
- `totalBalance: number` (cents)
- `transactions: Transaction[]`
- `kycTier: 'unverified' | 'tier-1' | 'tier-2' | 'tier-3'`
- `dailyLimitRemaining: number` (cents)

---

## Integration Patterns

### Pattern 1: Real-Time Match Updates

```tsx
import { useMatch } from '@/hooks/useSocket'
import { useMatchStore } from '@/stores/match.store'

export function MatchGame({ matchId }: { matchId: string }) {
  const { placeBid } = useMatch(matchId)
  const { players, currentPhase, currentHighBid } = useMatchStore()

  // Socket.io updates store automatically
  // Component re-renders on state changes

  const handleBidSubmit = (amount: number) => {
    placeBid(amount)
    // 1. Emits 'match:place-bid' to server
    // 2. Server broadcasts 'match:bid-placed'
    // 3. Socket listener updates store via updateBid()
    // 4. Component re-renders with new state
  }

  return (
    <BidSlider
      minBid={currentHighBid + 1}
      maxBid={999999}
      onBidSubmit={handleBidSubmit}
    />
  )
}
```

### Pattern 2: Form Submission with API

```tsx
import { useState } from 'react'
import { loginUser } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setUser } = useAuthStore()

  const handleSubmit = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const user = await loginUser(email, password)
      setUser(user) // Updates auth store
      // Redirect handled by auth guard
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const email = e.currentTarget.email.value
      const password = e.currentTarget.password.value
      handleSubmit(email, password)
    }}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
    </form>
  )
}
```

### Pattern 3: Real-Time Balance Display

```tsx
import { useWallet } from '@/hooks/useSocket'
import { useWalletStore } from '@/stores/wallet.store'

export function WalletBalance() {
  useWallet() // Sets up listeners
  const { availableBalance, escrowHold } = useWalletStore()

  // Updates automatically when 'wallet:balance-updated' received
  return (
    <div>
      <p>Available: ${(availableBalance / 100).toFixed(2)}</p>
      <p>Escrow: ${(escrowHold / 100).toFixed(2)}</p>
    </div>
  )
}
```

---

## Error Handling

### Socket.io Errors

```tsx
import { useSocket } from '@/hooks/useSocket'

export function Component() {
  const socket = useSocket({
    onError: (error) => {
      // Handle connection errors
      console.error('Socket error:', error)
      // Show toast/notification to user
    },
    onDisconnect: () => {
      // Connection lost
      // Show "Reconnecting..." indicator
    }
  })
}
```

### API Errors

```tsx
import { loginUser } from '@/lib/api'

try {
  await loginUser(email, password)
} catch (error: any) {
  if (error.response?.status === 401) {
    // Invalid credentials
    showError('Invalid email or password')
  } else if (error.response?.status === 429) {
    // Too many attempts
    showError('Too many login attempts, please try again later')
  } else if (error.code === 'ECONNABORTED') {
    // Timeout
    showError('Request timed out, please try again')
  } else {
    // Generic error
    showError(error.response?.data?.message || 'Something went wrong')
  }
}
```

---

## Environment Variables

Required `.env.local`:

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Socket.io
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Testing Integration

### Mock Socket.io Events

```tsx
import { useMatchStore } from '@/stores/match.store'

// Simulate phase change
useMatchStore.setState({
  currentPhase: { phase: 'reveal', round: 1, timeRemaining: 30000 }
})

// Simulate bid update
useMatchStore.setState({
  currentHighBid: 5000
})
```

### Mock API Responses

```tsx
import { api } from '@/lib/api'
import { vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  loginUser: vi.fn().mockResolvedValue({
    id: '123',
    username: 'test',
    token: 'token123'
  })
}))
```

---

## Production Checklist

- [ ] Verify Socket.io server URL in env vars
- [ ] Verify API base URL in env vars
- [ ] Test 401 auth error handling (logout + redirect)
- [ ] Test network disconnect/reconnect behavior
- [ ] Test bid submission under 100ms latency
- [ ] Test wallet updates with real payment gateway
- [ ] Load test with 100+ concurrent Socket.io connections
- [ ] Monitor Socket.io reconnection failures
- [ ] Setup error tracking (Sentry/LogRocket)
- [ ] Setup performance monitoring (Web Vitals)

---

## Troubleshooting

### Socket.io not connecting

1. Verify `NEXT_PUBLIC_SOCKET_URL` is correct
2. Check browser console for CORS errors
3. Verify server is running on correct port
4. Check auth token is present in `useAuthStore().user.token`

### API requests returning 401

1. User token expired - automatic logout should trigger
2. Check `Authorization` header in network tab
3. Verify token is valid via `verifyToken()`
4. Clear localStorage and re-login

### Real-time updates not reflecting

1. Check Socket.io connection status (should be "connected")
2. Verify event listener is attached (check useEffect)
3. Check store state update is firing (add console.logs)
4. Verify store selector is being used in component

### Bid not submitting

1. Check if `useMatch()` hook is initialized with matchId
2. Verify bid amount is valid (> currentHighBid)
3. Check Socket.io connection before emitting
4. Fallback to HTTP `placeBid()` API if Socket.io fails

---

## Next Steps

1. **Wire Page Components to Hooks**
   - Match game page uses `useMatch(matchId)`
   - Wallet page uses `useWallet()`
   - Profile page uses API endpoints

2. **Add Loading States**
   - BidSlider shows loading during submission
   - WalletBalance shows skeleton while loading

3. **Add Error Boundaries**
   - Catch Socket.io errors
   - Catch API errors
   - Display user-friendly messages

4. **Add Optimistic Updates**
   - Update UI immediately on action
   - Revert if server validation fails

5. **Setup Real-time Notifications**
   - Toast on match phase change
   - Toast on bid placed
   - Toast on win/loss

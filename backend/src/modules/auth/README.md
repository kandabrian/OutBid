# Auth Module Documentation

## Overview

The Auth module handles secure user authentication, session management, and JWT-based authorization. It supports both authenticated users and guest sessions.

**Key Features:**
- Secure password hashing (bcryptjs, 10 rounds)
- JWT token generation and validation
- Refresh token rotation for security
- Guest session support (24h expiry)
- HTTP-only cookie-based refresh tokens
- Rate-limiting on login/register (see middleware)

---

## Architecture

```
auth/
├── types.ts                # TypeScript interfaces
├── auth.service.ts         # Business logic layer
├── auth.controller.ts      # HTTP request handlers
├── auth.routes.ts          # Route registration
├── auth.middleware.ts      # JWT verification hooks
└── README.md              # This file
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1/auth/`

### Register

**Endpoint:** `POST /api/v1/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Validation Rules:**
- Email: Valid email format
- Username: 3-30 chars, alphanumeric + underscores only
- Password: Min 8 chars, must include uppercase, lowercase, and number

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "john_doe",
    "isGuest": false
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Error Codes:**
- `USER_ALREADY_EXISTS` (409) – Email or username already registered
- `VALIDATION_ERROR` (400) – Input validation failed

---

### Login

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "john_doe",
    "isGuest": false
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Error Codes:**
- `INVALID_CREDENTIALS` (401) – Wrong email or password
- `VALIDATION_ERROR` (400) – Input validation failed

**Security Note:** Response intentionally vague on purpose (doesn't reveal if email exists or not).

---

### Guest Session

**Endpoint:** `POST /api/v1/auth/guest`

**Request:** (No body required)

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "username": "guest_a1b2c3d4",
    "isGuest": true
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Notes:**
- Guest sessions valid for 24 hours
- No refresh token provided (single short-lived JWT)
- Guest users cannot deposit money or claim wins
- Great for trying the game without registration

---

### Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`

**Request:** (Refresh token in HTTP-only cookie, no body)

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Codes:**
- `INVALID_TOKEN` (401) – Token invalid or expired
- `MISSING_REFRESH_TOKEN` (401) – No refresh token in cookies

**Security Notes:**
- Refresh tokens stored in secure HTTP-only cookies
- New refresh token issued on each refresh (token rotation)
- Old tokens immediately invalidated
- Tokens expire after 7 days of inactivity

---

### Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Authentication:** Required (JWT in `Authorization: Bearer` header)

**Request:** (No body)

**Response (200 OK):**
```json
{
  "success": true
}
```

**Actions:**
- Revokes refresh token in database
- Clears refresh token cookie
- Client should discard access token

---

### Get Current User

**Endpoint:** `GET /api/v1/auth/me`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "john_doe",
    "isGuest": false
  }
}
```

**Error Codes:**
- `INVALID_TOKEN` (401) – Token invalid or expired
- `USER_NOT_FOUND` (404) – User was deleted (edge case)

---

## Database Schema

### `users` Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255),
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` – Unique user identifier
- `email` – User email (NULL for guests)
- `username` – Display name (auto-generated for guests)
- `password_hash` – Bcryptjs hash (NULL for guests)
- `is_guest` – Whether this is a temporary guest account
- `created_at` – Account creation timestamp

### `refresh_tokens` Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` – Token ID
- `user_id` – Reference to user
- `token` – Refresh token value (UUID format)
- `expires_at` – Expiration timestamp (7 days from creation)
- `created_at` – Token creation timestamp

---

## Security Considerations

### Password Security
1. **Bcryptjs Hashing:** Passwords hashed with bcryptjs (10 rounds)
   - 10 rounds ≈ 100ms per hash (intentionally slow to prevent brute force)
   - Salt automatically generated and included in hash
   - Password never logged or stored in plaintext

2. **Comparison:** Uses `bcryptjs.compare()` to prevent timing attacks

3. **Validation:** Enforced client-side and server-side
   - Min 8 characters
   - Must include uppercase, lowercase, and number
   - No simple patterns (e.g., "password123")

### JWT Security
1. **Token Format:**
   - Algorithm: HS256 (HMAC-SHA256)
   - Secret: 32+ character string from env (JWT_SECRET)
   - Access token TTL: 15 minutes
   - Refresh token TTL: 7 days

2. **Token Storage:**
   - Access token: In-memory or localStorage (client-side)
   - Refresh token: HTTP-only secure cookie
   - HTTP-only prevents XSS token theft
   - Secure flag prevents transmission over HTTP
   - SameSite=Strict prevents CSRF attacks

3. **Token Refresh:**
   - Refresh tokens are one-use (invalidated after use)
   - New refresh token issued on each refresh
   - Prevents token replay attacks
   - Suspicious activity detection possible (multiple refresh requests)

### Session Management
1. **Token Verification:**
   - All protected routes require valid JWT
   - Signature verified using JWT_SECRET
   - Expiration checked on every request
   - User context extracted from token payload

2. **Session Invalidation:**
   - Logout immediately revokes refresh token
   - Access token remains valid until expiry (standard behavior)
   - Users can have multiple concurrent sessions
   - Implement session blacklist for instant logout if needed

3. **Guest Sessions:**
   - Auto-expire after 24 hours
   - No refresh token (can't extend session)
   - Limited functionality (can't withdraw or claim rewards)
   - Useful for trying game without commitment

### Attack Prevention
1. **Brute Force:** Rate-limiting on login/register endpoints
   - 5 attempts per 15 minutes per IP
   - Temporary lockout after threshold
   - Logged for security monitoring

2. **SQL Injection:** Parameterized queries via Drizzle ORM

3. **Timing Attacks:** 
   - Password comparison using bcryptjs.compare() (constant-time)
   - Login response times deliberately similar on success/failure

4. **Token Forgery:** HS256 signature cannot be forged without secret

5. **Credential Stuffing:** Account lockout after N failed logins

---

## Usage Examples

### Client-Side Integration (React)

```typescript
// Register
const register = async (email: string, username: string, password: string) => {
  const res = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  })
  const data = await res.json()
  localStorage.setItem('accessToken', data.token)
  // refreshToken in secure cookie (auto-managed by browser)
  return data
}

// Login
const login = async (email: string, password: string) => {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  localStorage.setItem('accessToken', data.token)
  return data
}

// Protected request
const getProfile = async () => {
  const token = localStorage.getItem('accessToken')
  const res = await fetch('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include', // Include cookies
  })
  return res.json()
}

// Refresh token
const refreshToken = async () => {
  const res = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Required for cookie
  })
  const data = await res.json()
  localStorage.setItem('accessToken', data.token)
  return data
}

// Logout
const logout = async () => {
  const token = localStorage.getItem('accessToken')
  await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  localStorage.removeItem('accessToken')
}
```

---

## Deployment & Configuration

### Environment Variables

```bash
JWT_SECRET=your-super-secret-key-32-chars-minimum
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

### Prerequisites
1. PostgreSQL database with users and refresh_tokens tables
2. Node.js 18+
3. Fastify 5.x

### Testing

```bash
# Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"TestPass123"}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Get current user
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

### "Invalid credentials" on login attempt
- **Cause:** Wrong password or email
- **Solution:** Check spelling, reset password if needed

### "User already exists" on register
- **Cause:** Email or username already registered
- **Solution:** Use different email/username or login instead

### "Invalid or expired token" on protected route
- **Cause:** Access token expired or refresh token not rotated
- **Solution:** Call `/auth/refresh` to get new token

### Refresh token cookie not being sent
- **Cause:** Missing `credentials: 'include'` in fetch/axios
- **Solution:** Always include `credentials: 'include'` for cross-origin requests

### Guest session expires immediately
- **Cause:** JWT payload missing required fields
- **Solution:** Verify guest JWT includes `userId`, `username`, `isGuest`

---

## Future Enhancements

1. **Email Verification:** Send verification link on registration
2. **Two-Factor Authentication:** SMS or authenticator app
3. **Social Login:** Google, GitHub OAuth2
4. **Password Reset:** Secure token-based password reset flow
5. **Session Management:** View/revoke active sessions
6. **Account Recovery:** Backup codes or recovery email
7. **Audit Logging:** Track login attempts, token refreshes
8. **Device Fingerprinting:** Detect unusual login locations

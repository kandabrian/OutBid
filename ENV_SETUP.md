# Environment Setup Guide - OutBid

## ✅ Setup Instructions

Your environment configuration has been set up. For security, **never commit secrets to version control**.

### Backend Configuration (`.env`)

**Supabase Setup:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API Keys
3. Copy your Anon Key and Secret Key
4. Copy your Project URL
5. Add these values to `backend/.env`:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=sb_publishable_your_key_here
SUPABASE_SECRET_KEY=sb_secret_your_secret_here
SUPABASE_PROJECT_ID=your_project_id
```

**Database Connection:**
1. Go to Supabase Dashboard > Settings > Database
2. Copy the connection string
3. Add to `backend/.env`:

```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

### Frontend Configuration (`.env.local`)

**API Endpoints:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_key_here
```

## 📋 Additional Configuration


### 1. **Database Password**
```bash
# Update DATABASE_URL in backend/.env
DATABASE_URL=postgresql://postgres:[YOUR_ACTUAL_PASSWORD]@db.niledjsdwwhsjtgjoiow.supabase.co:5432/postgres
```

### 2. **Payment Providers** (Optional for development)

#### Stripe
- Get keys from: https://dashboard.stripe.com/apikeys
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Paystack (M-Pesa)
- Get keys from: https://dashboard.paystack.com/#/settings/developer
```
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_PUBLIC_KEY=pk_...
```

#### Thirdweb (Crypto)
- Get Client ID from: https://thirdweb.com/create
```
THIRDWEB_CLIENT_ID=...
THIRDWEB_SECRET_KEY=...
```

### 3. **Email Configuration** (Optional)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 4. **JWT Secrets** (Change from defaults)
```
# Generate strong random strings for production
JWT_SECRET=<strong-random-string-here>
REFRESH_TOKEN_SECRET=<another-strong-random-string>
ADMIN_SECRET=<admin-secret-here>
```

## 🚀 Starting the Application

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Socket.io Server (if separate)
The Socket.io server runs on port 3001 by default, configured in backend `.env`.

## 🔒 Security Notes

- **Never commit `.env` files** to version control (already in `.gitignore`)
- **Production secrets** should be stored in your deployment platform (Vercel, Heroku, etc.)
- **JWT_SECRET** and **JWT_REFRESH_SECRET** must be changed from the example values
- **Publishable keys** (Stripe, Paystack, Supabase Anon) can be public - only keep in `.env.local`
- **Secret keys** (Stripe, Paystack) must NEVER be in frontend code

## 📝 Environment Variables by Category

### Database
- `SUPABASE_PROJECT_ID` - Project identifier
- `SUPABASE_URL` - API endpoint
- `SUPABASE_ANON_KEY` - Public key for auth
- `SUPABASE_SECRET_KEY` - Server-side key
- `DATABASE_URL` - PostgreSQL connection string

### Authentication
- `JWT_SECRET` - Signing key for access tokens
- `JWT_EXPIRATION` - Token validity (default: 24h)
- `REFRESH_TOKEN_SECRET` - Refresh token signing key
- `REFRESH_TOKEN_EXPIRATION` - Refresh validity (default: 7d)

### Payments
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Paystack: `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`
- Thirdweb: `THIRDWEB_CLIENT_ID`, `THIRDWEB_SECRET_KEY`

### Real-time
- `REDIS_URL` - Cache & real-time messaging
- `SOCKET_PORT` - Socket.io server port
- `SOCKET_CORS_ORIGIN` - CORS allowed origins

### Game Settings
- `BIDDING_PHASE_DURATION_MS` - Time for bidding (default: 30s)
- `REVEAL_PHASE_DURATION_MS` - Time for reveals (default: 5s)
- `MIN_ENTRY_FEE_CENTS` - Minimum bet (default: $1)
- `MAX_ENTRY_FEE_CENTS` - Maximum bet (default: $99,999.99)
- `PLATFORM_FEE_PERCENT` - Fee on deposits (default: 2%)

## ✨ Next Steps

1. ✅ Fill in the database password in `DATABASE_URL`
2. (Optional) Add payment provider credentials
3. Run database migrations: `npm run db:migrate`
4. Start backend: `npm run dev`
5. Start frontend: `npm run dev`
6. Visit http://localhost:3000

## 📚 References

- [Supabase Docs](https://supabase.com/docs)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Paystack Documentation](https://paystack.com/docs)
- [Thirdweb SDK](https://thirdweb.com/docs)

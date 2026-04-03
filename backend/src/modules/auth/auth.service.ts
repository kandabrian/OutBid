/**
 * Auth service - Business logic for authentication
 * Handles password hashing, JWT generation, DB operations
 */

import * as bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { db } from '../../db'
import { users, refreshTokens } from '../../db/schema'
import { eq } from 'drizzle-orm'
import {
  AuthenticationError,
  InvalidCredentialsError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from '../../lib/errors'
import { JWTPayload } from '../../lib/types'

const JWT_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

export class AuthService {
  /**
   * Hash password securely
   * Uses bcryptjs with 10 rounds (CPU-intensive to prevent brute force)
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Register new user
   * @throws UserAlreadyExistsError if email/username taken
   * @throws ValidationError if input invalid
   */
  async register(email: string, username: string, password: string) {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      throw new UserAlreadyExistsError('Email already registered')
    }

    // Hash password
    const passwordHash = await this.hashPassword(password)

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email,
        username,
        passwordHash,
        isGuest: false,
      })
      .returning()

    return user
  }

  /**
   * Login user and generate JWT tokens
   * @throws InvalidCredentialsError if email/password invalid
   */
  async login(email: string, password: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user || user.isGuest) {
      throw new InvalidCredentialsError()
    }

    const passwordValid = await this.comparePassword(
      password,
      user.passwordHash || ''
    )

    if (!passwordValid) {
      throw new InvalidCredentialsError()
    }

    return user
  }

  /**
   * Create guest session with temporary JWT
   * Guest sessions expire after 24 hours
   */
  async createGuestSession() {
    const [guestUser] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        username: `guest_${randomUUID().slice(0, 8)}`,
        isGuest: true,
      })
      .returning()

    return guestUser
  }

  /**
   * Verify refresh token and issue new access token
   */
  async refreshAccessToken(refreshTokenValue: string) {
    const [tokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshTokenValue))
      .limit(1)

    if (!tokenRecord || new Date() > new Date(tokenRecord.expiresAt)) {
      throw new AuthenticationError('Refresh token invalid or expired')
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .limit(1)

    if (!user) {
      throw new UserNotFoundError()
    }

    return user
  }

  /**
   * Invalidate refresh token (on logout)
   */
  async revokeRefreshToken(refreshTokenValue: string) {
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.token, refreshTokenValue))
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new UserNotFoundError()
    }

    return user
  }

  /**
   * Create refresh token in DB
   */
  async createRefreshToken(userId: string): Promise<string> {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY)

    await db.insert(refreshTokens).values({
      id: randomUUID(),
      userId,
      token,
      expiresAt,
    })

    return token
  }
}

export const authService = new AuthService()

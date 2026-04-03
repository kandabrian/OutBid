/**
 * Auth controller - HTTP request handlers
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authService } from './auth.service'
import { registerSchema, loginSchema } from '../../lib/validators'
import { RegisterRequest, LoginRequest, AuthResponse, GuestSessionResponse } from './types'
import { logger } from '../../lib/logger'

const REFRESH_TOKEN_COOKIE = 'refreshToken'

/**
 * POST /api/v1/auth/register
 * Register new user account
 */
export async function registerHandler(
  this: FastifyInstance,
  req: FastifyRequest<{ Body: RegisterRequest }>,
  reply: FastifyReply
) {
  // Validate input
  const validatedInput = registerSchema.parse(req.body)

  // Register user
  const user = await authService.register(
    validatedInput.email,
    validatedInput.username,
    validatedInput.password
  )

  // Create tokens
  const token = this.jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      isGuest: false,
    },
    { expiresIn: '15m' }
  )

  const refreshToken = await authService.createRefreshToken(user.id)

  // Set refresh token in secure HTTP-only cookie
  reply.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  logger.info({ userId: user.id }, 'User registered')

  return reply.status(201).send({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isGuest: false,
    },
    token,
    refreshToken,
  } as AuthResponse)
}

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
export async function loginHandler(
  this: FastifyInstance,
  req: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
) {
  // Validate input
  const validatedInput = loginSchema.parse(req.body)

  // Authenticate
  const user = await authService.login(
    validatedInput.email,
    validatedInput.password
  )

  // Create tokens
  const token = this.jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      isGuest: false,
    },
    { expiresIn: '15m' }
  )

  const refreshToken = await authService.createRefreshToken(user.id)

  // Set refresh token in secure HTTP-only cookie
  reply.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  logger.info({ userId: user.id }, 'User logged in')

  return reply.send({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isGuest: false,
    },
    token,
    refreshToken,
  } as AuthResponse)
}

/**
 * POST /api/v1/auth/guest
 * Create anonymous guest session
 */
export async function guestHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
) {
  const user = await authService.createGuestSession()

  // Guest tokens expire after 24 hours or match end
  const token = this.jwt.sign(
    {
      userId: user.id,
      username: user.username,
      isGuest: true,
    },
    { expiresIn: '24h' }
  )

  logger.info({ userId: user.id }, 'Guest session created')

  return reply.status(201).send({
    user: {
      id: user.id,
      username: user.username,
      isGuest: true,
    },
    token,
  } as GuestSessionResponse)
}

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
export async function refreshAccessTokenHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
) {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE]

  if (!refreshToken) {
    return reply.status(401).send({
      error: {
        code: 'MISSING_REFRESH_TOKEN',
        message: 'Refresh token not found in cookies',
      },
    })
  }

  const user = await authService.refreshAccessToken(refreshToken)

  // Issue new access token
  const newToken = this.jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      isGuest: user.isGuest,
    },
    { expiresIn: '15m' }
  )

  logger.info({ userId: user.id }, 'Access token refreshed')

  return reply.send({
    token: newToken,
  })
}

/**
 * POST /api/v1/auth/logout
 * Invalidate refresh token and user session
 */
export async function logoutHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
) {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE]

  if (refreshToken) {
    await authService.revokeRefreshToken(refreshToken)
  }

  reply.clearCookie(REFRESH_TOKEN_COOKIE)

  logger.info({ userId: req.user?.userId }, 'User logged out')

  return reply.send({ success: true })
}

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
export async function getCurrentUserHandler(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
) {
  const user = await authService.getUserById(req.user.userId)

  return reply.send({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isGuest: user.isGuest,
    },
  })
}

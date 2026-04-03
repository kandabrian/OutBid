/**
 * User module controller - HTTP handlers for user operations
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { userService } from './user.service'
import { updateProfileSchema } from '../../lib/validators'
import { logger } from '../../lib/logger'

/**
 * GET /api/v1/users/me/profile
 * Get current authenticated user's profile
 */
export async function getMyProfile(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (req.user as any)?.userId || (req.user as any)
  const profile = await userService.getProfile(userId)
  return reply.send(profile)
}

/**
 * GET /api/v1/users/:id
 * Get user profile by ID (public)
 */
export async function getUserProfile(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (req.params as any).id
  const profile = await userService.getProfile(userId)
  return reply.send(profile)
}

/**
 * PUT /api/v1/users/:id
 * Update user profile (only self)
 */
export async function updateUserProfile(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (req.params as any).id
  const currentUserId = (req.user as any)?.userId || (req.user as any)
  
  // Users can only update their own profile
  if (userId !== currentUserId) {
    return reply.status(403).send({
      error: {
        code: 'FORBIDDEN',
        message: 'Can only update your own profile',
      },
    })
  }

  const validated = updateProfileSchema.parse(req.body)

  const updated = await userService.updateProfile(currentUserId, validated)

  logger.info(
    { userId: currentUserId, changes: Object.keys(validated) },
    'Profile updated'
  )

  return reply.send(updated)
}

/**
 * GET /api/v1/users/:id/stats
 * Get user statistics (public, read-only)
 */
export async function getUserStats(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (req.params as any).id
  const stats = await userService.getStats(userId)
  return reply.send(stats)
}

/**
 * GET /api/v1/users/me/stats
 * Get current user's statistics
 */
export async function getMyStats(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (req.user as any)?.userId || (req.user as any)
  const stats = await userService.getStats(userId)
  return reply.send(stats)
}

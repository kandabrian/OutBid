/**
 * Match controller - HTTP request handlers for match operations
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { matchService } from './match.service'
import { createMatchSchema, placeBidSchema } from '../../lib/validators'
import { logger } from '../../lib/logger'

/**
 * Create a new match lobby
 * POST /api/v1/match/create
 */
export async function createMatch(
  req: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  try {
    const validated = createMatchSchema.parse(req.body)
    const userId = (req.user as any).userId

    const match = await matchService.createMatch(userId, validated.entryFee)

    logger.info(
      {
        userId,
        matchId: match.id,
        entryFee: validated.entryFee,
      },
      'Match created'
    )

    return reply.status(201).send({
      match: {
        id: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        status: match.status,
        entryFee: match.entryFee,
        roomToken: match.roomToken,
        startedAt: match.startedAt,
        createdAt: match.createdAt,
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * Join an existing match
 * POST /api/v1/match/:id/join
 */
export async function joinMatch(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const matchId = req.params.id
    const userId = (req.user as any).userId

    const match = await matchService.joinMatch(matchId, userId)

    logger.info(
      {
        userId,
        matchId,
      },
      'Player joined match'
    )

    return reply.status(200).send({
      match: {
        id: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        status: match.status,
        entryFee: match.entryFee,
        roomToken: match.roomToken,
        startedAt: match.startedAt,
        createdAt: match.createdAt,
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * Get match status and player info
 * GET /api/v1/match/:id
 */
export async function getMatchStatus(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const matchId = req.params.id
    const match = await matchService.getMatch(matchId)

    return reply.status(200).send({
      match: {
        id: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        winnerId: match.winnerId,
        status: match.status,
        entryFee: match.entryFee,
        roomToken: match.roomToken,
        startedAt: match.startedAt,
        completedAt: match.completedAt,
        createdAt: match.createdAt,
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * Get list of available matches (not yet started)
 * GET /api/v1/match/list/available
 */
export async function getAvailableMatches(
  req: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1'))
    const limit = Math.min(parseInt(req.query.limit || '50'), 100)
    const offset = (page - 1) * limit

    const { matches, total } = await matchService.getAvailableMatches(limit, offset)

    return reply.status(200).send({
      matches: matches.map((m) => ({
        id: m.id,
        player1Id: m.player1Id,
        entryFee: m.entryFee,
        createdAt: m.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    throw error
  }
}

/**
 * Cancel a match (only player1 or admin can do this)
 * POST /api/v1/match/:id/cancel
 */
export async function cancelMatch(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const matchId = req.params.id
    const userId = (req.user as any).userId

    // Verify requesting user is player1
    const match = await matchService.getMatch(matchId)
    if (match.player1Id !== userId) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Only match creator can cancel',
        },
      })
    }

    // Cannot cancel if match already started
    if (match.status !== 'waiting') {
      return reply.status(400).send({
        error: {
          code: 'INVALID_STATE',
          message: 'Cannot cancel active or completed match',
        },
      })
    }

    await matchService.cancelMatch(matchId, 'user_cancelled')

    logger.info({ matchId, userId }, 'Match cancelled by user')

    return reply.status(200).send({
      message: 'Match cancelled successfully',
    })
  } catch (error) {
    throw error
  }
}

/**
 * Global error handler middleware
 * Catches and formats all errors consistently
 */

import { FastifyInstance } from 'fastify'
import { AppError } from './errors'
import pino from 'pino'
import { ZodError } from 'zod'

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
    requestId: string
    timestamp: string
  }
}

export function setupErrorHandler(app: FastifyInstance) {
  const logger = pino()

  app.setErrorHandler(async (err, req, reply) => {
    const requestId = req.id

    // Handle Zod validation errors
    if (err instanceof ZodError) {
      logger.warn(
        { requestId, error: err.issues },
        'Validation error'
      )
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: {
            fields: err.issues.reduce(
              (acc: Record<string, string>, issue: any) => ({
                ...acc,
                [issue.path.join('.')]: issue.message,
              }),
              {}
            ),
          },
          requestId,
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse)
    }

    // Handle custom app errors
    if (err instanceof AppError) {
      logger.warn(
        { requestId, code: err.code, statusCode: err.statusCode },
        err.message
      )
      return reply.status(err.statusCode).send({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId,
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse)
    }

    // Handle standard Fastify errors
    if (err instanceof Error && 'statusCode' in err && typeof (err as any).statusCode === 'number') {
      logger.error(
        { requestId, statusCode: (err as any).statusCode, error: err },
        'HTTP error'
      )
      return reply.status((err as any).statusCode).send({
        error: {
          code: 'HTTP_ERROR',
          message: err.message || 'Internal server error',
          requestId,
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse)
    }

    // Unhandled errors
    logger.error(
      { requestId, error: err, stack: err instanceof Error ? err.stack : undefined },
      'Unhandled error'
    )
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err instanceof Error ? err.message : 'Unknown error',
        requestId,
        timestamp: new Date().toISOString(),
      },
    } as ErrorResponse)
  })
}

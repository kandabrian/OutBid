/**
 * Structured logging utility
 * JSON format for production-ready log aggregation
 */

import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

const pinoConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
}

export const logger = pino(pinoConfig)

/**
 * Log structured data with context
 */
export const createContextLogger = (context: {
  requestId: string
  userId?: string
  path?: string
  method?: string
}) => {
  return logger.child(context)
}

/**
 * Request logging middleware factory
 */
export const createRequestLogger = () => {
  return async (req: any, reply: any) => {
    const start = Date.now()
    req.log = logger.child({ requestId: req.id })

    reply.then(() => {
      const duration = Date.now() - start
      req.log[reply.statusCode >= 400 ? 'warn' : 'info'](
        {
          method: req.method,
          path: req.url,
          statusCode: reply.statusCode,
          duration: `${duration}ms`,
          userAgent: req.headers['user-agent'],
        },
        `${req.method} ${req.url}`
      )
    })
  }
}

/**
 * Fastify plugin for request logging
 * Registers onResponse hook at the server level (correct approach)
 */
export const requestLoggerPlugin = async (fastify: any) => {
  fastify.addHook('onRequest', async (req: any) => {
    req.startTime = Date.now()
    req.log = logger.child({ requestId: req.id })
  })

  fastify.addHook('onResponse', async (req: any, reply: any) => {
    const duration = Date.now() - (req.startTime || Date.now())
    req.log[reply.statusCode >= 400 ? 'warn' : 'info'](
      {
        method: req.method,
        path: req.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        userAgent: req.headers['user-agent'],
      },
      `${req.method} ${req.url}`
    )
  })
}
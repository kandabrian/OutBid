/**
 * Payment module routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

export async function paymentRoutes(app: FastifyInstance) {
  // Stripe payment intent
  app.post(
    '/stripe/intent',
    { onRequest: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      reply.send({ message: 'Create Stripe intent — TODO' })
    }
  )

  // Stripe webhook
  app.post(
    '/webhook/stripe',
    async (req: FastifyRequest, reply: FastifyReply) => {
      reply.send({ message: 'Stripe webhook — TODO' })
    }
  )

  // M-Pesa initiation
  app.post(
    '/mpesa/initiate',
    { onRequest: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      reply.send({ message: 'Initiate M-Pesa — TODO' })
    }
  )

  // Paystack webhook
  app.post(
    '/webhook/paystack',
    async (req: FastifyRequest, reply: FastifyReply) => {
      reply.send({ message: 'Paystack webhook — TODO' })
    }
  )

  // Crypto deposit
  app.post(
    '/crypto/address',
    { onRequest: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      reply.send({ message: 'Get crypto address — TODO' })
    }
  )
}

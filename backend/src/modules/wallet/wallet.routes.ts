import { FastifyInstance } from 'fastify'

export async function walletRoutes(app: FastifyInstance) {
  app.get('/balance', async (req, reply) => reply.send({ message: 'balance — TODO' }))
  app.post('/deposit', async (req, reply) => reply.send({ message: 'deposit — TODO' }))
}

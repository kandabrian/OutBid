import { FastifyInstance } from 'fastify'

export async function matchRoutes(app: FastifyInstance) {
  app.post('/create', async (req, reply) => reply.send({ message: 'create match — TODO' }))
  app.get('/:id', async (req, reply) => reply.send({ message: 'get match — TODO' }))
}

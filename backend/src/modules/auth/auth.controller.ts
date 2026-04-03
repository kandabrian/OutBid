import { FastifyRequest, FastifyReply } from 'fastify'

export async function registerHandler(req: FastifyRequest, reply: FastifyReply) {
  reply.send({ message: 'register — TODO' })
}

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  reply.send({ message: 'login — TODO' })
}

export async function guestHandler(req: FastifyRequest, reply: FastifyReply) {
  reply.send({ message: 'guest — TODO' })
}

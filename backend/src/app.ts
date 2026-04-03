import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { registerRoutes } from './routes'

export async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: process.env.CLIENT_URL, credentials: true })
  await app.register(cookie)
  await app.register(jwt, { secret: process.env.JWT_SECRET! })

  await registerRoutes(app)

  return app
}

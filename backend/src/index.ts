import 'dotenv/config'
import { buildApp } from './app'

const start = async () => {
  const app = await buildApp()
  await app.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' })
  console.log(`Server running on http://localhost:${process.env.PORT || 4000}`)
}

start()

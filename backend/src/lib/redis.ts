/**
 * Redis client initialization and utilities
 * Used for caching, session management, pub/sub, and rate limiting
 */

import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: null,
})

redis.on('connect', () => {
  console.log('Redis connected')
})

redis.on('error', (err) => {
  console.error('Redis error:', err)
})

/**
 * Helper: Set key with expiry
 */
export async function setWithExpiry(
  key: string,
  value: string | number,
  expirySeconds: number
) {
  await redis.set(key, value, 'EX', expirySeconds)
}

/**
 * Helper: Increment with expiry (for rate limiting)
 */
export async function incrementWithExpiry(
  key: string,
  expirySeconds: number
): Promise<number> {
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, expirySeconds)
  }
  return count
}

/**
 * Helper: Check if key exists
 */
export async function exists(key: string): Promise<boolean> {
  const result = await redis.exists(key)
  return result === 1
}

/**
 * Helper: Delete key
 */
export async function deleteKey(key: string) {
  await redis.del(key)
}

import { Redis } from "ioredis"

const globalRedis = globalThis as unknown as { redis: Redis | undefined }

function createRedis() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379"
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  })
}

export const redis = globalRedis.redis ?? createRedis()

if (process.env.NODE_ENV !== "production") {
  globalRedis.redis = redis
}

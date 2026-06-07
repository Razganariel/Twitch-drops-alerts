import { Queue } from "bullmq"

const REDIS_URL = process.env.REDIS_URL || "redis://192.168.1.222:6379"
const url = new URL(REDIS_URL)

export type AlertJobData = {
  userId: string
  email: string
  gameName: string
  dropName: string
  endAt: string
  twitchUrl: string
}

export const alertQueue = new Queue<AlertJobData>("alerts", {
  connection: {
    host: url.hostname,
    port: Number(url.port) || 6379,
    ...(url.password ? { password: url.password } : {}),
  },
})

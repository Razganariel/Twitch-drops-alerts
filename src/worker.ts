import "dotenv/config"
import { Worker } from "bullmq"
import { sendDropAlert } from "./services/email"

const REDIS_URL = process.env.REDIS_URL || "redis://192.168.1.222:6379"
const url = new URL(REDIS_URL)

const worker = new Worker(
  "alerts",
  async (job) => {
    const { email, gameName, dropName, endAt, twitchUrl } = job.data

    await sendDropAlert({
      to: email,
      gameName,
      dropName,
      endAt: new Date(endAt),
      twitchUrl,
    })
  },
  {
    connection: {
      host: url.hostname,
      port: Number(url.port) || 6379,
      ...(url.password ? { password: url.password } : {}),
    },
  }
)

worker.on("completed", (job) => {
  const { gameName } = job.data
  console.log(`Email sent for ${gameName} (job ${job.id})`)
})

worker.on("failed", (job, err) => {
  console.error(`Email failed for alert ${job?.id}: ${err.message}`)
})

console.log("Worker started, waiting for alert jobs...")

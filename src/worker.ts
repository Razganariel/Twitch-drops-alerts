import "dotenv/config"
import { Worker } from "bullmq"
import { sendAlertEmail } from "./services/email"

const REDIS_URL = process.env.REDIS_URL || "redis://192.168.1.222:6379"
const url = new URL(REDIS_URL)

const worker = new Worker(
  "alerts",
  async (job) => {
    const { email, gameName, campaignName, rewardName, requiredMinutesWatched, endAt } = job.data

    await sendAlertEmail({
      to: email,
      gameName,
      campaignName,
      rewardName,
      requiredMinutesWatched,
      endAt: new Date(endAt),
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
  console.log(`Email sent for alert ${job.id}`)
})

worker.on("failed", (job, err) => {
  console.error(`Email failed for alert ${job?.id}: ${err.message}`)
})

console.log("Worker started, waiting for alert jobs...")

import "dotenv/config"
import { Worker } from "bullmq"
import { sendDropAlert } from "./services/email"
import { startSyncWorker, syncQueue } from "./lib/sync"

const REDIS_URL = process.env.REDIS_URL || "redis://192.168.1.222:6379"
const url = new URL(REDIS_URL)

const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  ...(url.password ? { password: url.password } : {}),
}

const alertWorker = new Worker(
  "alerts",
  async (job) => {
    const { email, gameName, gameBoxArtUrl, gameSteamAppId, dropName, startAt, endAt, twitchUrl, dropItems } = job.data

    await sendDropAlert({
      to: email,
      gameName,
      gameBoxArtUrl,
      gameSteamAppId,
      dropName,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      twitchUrl,
      dropItems,
    })
  },
  { connection }
)

alertWorker.on("completed", (job) => {
  const { gameName } = job.data
  console.log(`Email sent for ${gameName} (job ${job.id})`)
})

alertWorker.on("failed", (job, err) => {
  console.error(`Email failed for alert ${job?.id}: ${err.message}`)
})

async function main() {
  await syncQueue.upsertJobScheduler(
    "periodic-sync",
    { every: 60_000 },
    {}
  )

  startSyncWorker()

  console.log("Sync worker started, periodic job registered every 60s")
}

main().catch(console.error)

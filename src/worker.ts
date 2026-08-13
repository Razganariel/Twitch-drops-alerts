import "dotenv/config"
import "./lib/logger"
import { runPeriodicSync } from "./lib/sync"

async function main() {
  await runPeriodicSync()
  setInterval(() => {
    runPeriodicSync()
  }, 60_000)

  console.log("[worker] Sync planifiée toutes les 60s — mode direct (pas de Redis/BullMQ)")
}

main().catch(console.error)

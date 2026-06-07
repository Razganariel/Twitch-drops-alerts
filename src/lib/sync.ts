import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Queue, Worker } from "bullmq"
import { getActiveDropCampaigns } from "../services/twitch"
import { parseTwitchDate } from "./timezone"
import { alertQueue } from "./queue"

const REDIS_URL = process.env.REDIS_URL || "redis://192.168.1.222:6379"
const redisUrl = new URL(REDIS_URL)
const redisConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  ...(redisUrl.password ? { password: redisUrl.password } : {}),
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

function normalize(name: string) {
  return name.toLowerCase().trim()
}

async function runPeriodicSync() {
  console.log("[sync] Début de la synchronisation planifiée")

  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
    },
    include: {
      twitchConnection: true,
      steamConnection: true,
    },
  })

  const connectedUsers = users.filter(
    (u) =>
      u.email &&
      u.steamConnection &&
      u.twitchConnection?.gqlAccessToken
  )

  if (connectedUsers.length === 0) {
    console.log("[sync] Aucun utilisateur avec Twitch + Steam connectés")
    return { ok: true, count: 0 }
  }

  const now = new Date()

  const dueUsers = connectedUsers.filter((user) => {
    if (!user.lastMatchAt) return true
    const intervalMs = (user.checkInterval || 15) * 60 * 1000
    return now.getTime() - user.lastMatchAt.getTime() >= intervalMs
  })

  if (dueUsers.length === 0) {
    console.log("[sync] Aucun utilisateur à traiter")
    return { ok: true, count: 0 }
  }

  const firstGqlToken = dueUsers[0].twitchConnection?.gqlAccessToken
  if (!firstGqlToken) {
    console.log("[sync] Aucun token GQL disponible")
    return { ok: false, count: 0 }
  }

  let campaigns
  try {
    campaigns = await getActiveDropCampaigns(firstGqlToken)
  } catch (e) {
    console.error("[sync] Échec de la récupération des drops:", e)
    return { ok: false, count: 0 }
  }

  await prisma.twitchDrop.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  })

  const seen = new Set<string>()
  const unique = campaigns.filter((c) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })

  for (const campaign of unique) {
    if (!campaign.game) continue
    const firstDrop = campaign.timeBasedDrops?.[0]

    await prisma.twitchDrop.upsert({
      where: { campaignId: campaign.id },
      update: {
        twitchGameId: campaign.game.id,
        gameName: campaign.game.displayName ?? campaign.game.name,
        gameBoxArtUrl: campaign.game.boxArtURL,
        campaignName: campaign.name,
        rewardName: firstDrop?.reward?.name ?? firstDrop?.name,
        requiredMinutesWatched: firstDrop?.requiredMinutesWatched ?? null,
        startAt: parseTwitchDate(campaign.startAt, "UTC"),
        endAt: parseTwitchDate(campaign.endAt, "UTC"),
        isActive: true,
      },
      create: {
        campaignId: campaign.id,
        twitchGameId: campaign.game.id,
        gameName: campaign.game.displayName ?? campaign.game.name,
        gameBoxArtUrl: campaign.game.boxArtURL,
        campaignName: campaign.name,
        rewardName: firstDrop?.reward?.name ?? firstDrop?.name,
        requiredMinutesWatched: firstDrop?.requiredMinutesWatched ?? null,
        startAt: parseTwitchDate(campaign.startAt, "UTC"),
        endAt: parseTwitchDate(campaign.endAt, "UTC"),
        isActive: true,
      },
    })
  }

  console.log(`[sync] ${unique.length} campagnes synchronisées`)

  const activeDrops = await prisma.twitchDrop.findMany({
    where: { isActive: true },
  })

  if (activeDrops.length === 0) {
    console.log("[sync] Aucun drop actif, matching ignoré")
    for (const user of dueUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastMatchAt: now },
      })
    }
    return { ok: true, count: 0 }
  }

  let totalAlerts = 0

  for (const user of dueUsers) {
    const userGames = await prisma.userGame.findMany({
      where: { userId: user.id },
      include: { game: true },
    })

    if (userGames.length === 0) continue

    let matchCount = 0

    for (const drop of activeDrops) {
      const dropGameName = normalize(drop.gameName)

      const matchedGame = userGames.find(
        (ug) => normalize(ug.game.name) === dropGameName
      )

      if (!matchedGame) continue

      const existing = await prisma.alert.findFirst({
        where: {
          userId: user.id,
          gameId: matchedGame.game.id,
          dropId: drop.id,
        },
      })

      if (existing) continue

      await prisma.alert.create({
        data: {
          userId: user.id,
          gameId: matchedGame.game.id,
          dropId: drop.id,
        },
      })

      try {
        await alertQueue.add("send-alert", {
          userId: user.id,
          email: user.email!,
          gameName: drop.gameName,
          dropName: drop.campaignName,
          endAt: drop.endAt.toISOString(),
          twitchUrl: "https://www.twitch.tv/drops/inventory",
        })
      } catch (e) {
        console.error(`[sync] Échec de l'envoi email pour ${user.id}:`, e)
      }

      matchCount++
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastMatchAt: now },
    })

    if (matchCount > 0) {
      console.log(`[sync] ${matchCount} alertes pour l'utilisateur ${user.id}`)
      totalAlerts += matchCount
    }
  }

  console.log(`[sync] Synchronisation terminée: ${totalAlerts} alertes générées`)
  return { ok: true, count: totalAlerts }
}

export const syncQueue = new Queue("sync", {
  connection: redisConnection,
})

export function startSyncWorker() {
  const worker = new Worker(
    "sync",
    async () => {
      await runPeriodicSync()
    },
    { connection: redisConnection }
  )

  worker.on("completed", (job) => {
    console.log(`[sync] Job ${job.id} terminé`)
  })

  worker.on("failed", (job, err) => {
    console.error(`[sync] Job ${job?.id} échoué: ${err.message}`)
  })

  console.log("[sync] Worker démarré")
  return worker
}

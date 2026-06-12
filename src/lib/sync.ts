import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { getActiveDropCampaigns, getDropCampaignDetails } from "../services/twitch"
import { getSyncGqlToken } from "../services/sync-account"
import { parseTwitchDate } from "./timezone"
import { normalize } from "./utils"
import { safeDecrypt } from "./encryption"
import { type AlertJobData } from "./queue"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

export async function runPeriodicSync() {
  console.log("[sync] Début de la synchronisation planifiée")

  const users = await prisma.user.findMany({
    where: {
      emailHash: { not: null },
    },
    include: {
      twitchConnection: true,
      steamConnection: true,
    },
  })

  const connectedUsers = users.filter(
    (u) =>
      u.email &&
      u.emailHash &&
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

  const gqlToken = await getSyncGqlToken()
  if (!gqlToken) {
    console.log("[sync] Aucun token de service disponible")
    return { ok: false, count: 0 }
  }

  let campaigns
  try {
    campaigns = await getActiveDropCampaigns(gqlToken)
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

    let items = campaign.timeBasedDrops ?? []

    if (items.length === 0 && gqlToken) {
      try {
        const details = await getDropCampaignDetails(gqlToken, campaign.id, "twitchdropsalert_bot")
        if (details?.timeBasedDrops) {
          items = details.timeBasedDrops
        }
      } catch {
        console.log("[sync] Échec détail campagne", campaign.name)
      }
    }

    const firstItem = items[0]

    const drop = await prisma.twitchDrop.upsert({
      where: { campaignId: campaign.id },
      update: {
        twitchGameId: campaign.game.id,
        gameName: campaign.game.displayName ?? campaign.game.name,
        gameBoxArtUrl: campaign.game.boxArtURL,
        campaignName: campaign.name,
        rewardName: firstItem?.benefitEdges?.[0]?.benefit?.name ?? firstItem?.reward?.name ?? firstItem?.name ?? null,
        requiredMinutesWatched: firstItem?.requiredMinutesWatched ?? null,
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
        rewardName: firstItem?.benefitEdges?.[0]?.benefit?.name ?? firstItem?.reward?.name ?? firstItem?.name ?? null,
        requiredMinutesWatched: firstItem?.requiredMinutesWatched ?? null,
        startAt: parseTwitchDate(campaign.startAt, "UTC"),
        endAt: parseTwitchDate(campaign.endAt, "UTC"),
        isActive: true,
      },
    })

    await prisma.dropItem.deleteMany({ where: { twitchDropId: drop.id } })

    if (items.length > 0) {
      await prisma.$transaction(
        items.map((item, i) =>
          prisma.dropItem.create({
          data: {
            twitchDropId: drop.id,
            name: item.name,
            rewardName: item.benefitEdges?.[0]?.benefit?.name ?? item.reward?.name ?? null,
            rewardImageUrl: item.benefitEdges?.[0]?.benefit?.imageAssetURL ?? item.benefitEdges?.[0]?.benefit?.imageURL ?? item.reward?.imageURL ?? null,
            requiredMinutesWatched: item.requiredMinutesWatched ?? null,
            sortOrder: i,
          },
        })
      )
      )
    } else {
      await prisma.dropItem.create({
        data: {
          twitchDropId: drop.id,
          name: campaign.name,
          rewardName: firstItem?.benefitEdges?.[0]?.benefit?.name ?? firstItem?.reward?.name ?? firstItem?.name ?? campaign.name,
          rewardImageUrl: firstItem?.benefitEdges?.[0]?.benefit?.imageAssetURL ?? firstItem?.benefitEdges?.[0]?.benefit?.imageURL ?? firstItem?.reward?.imageURL ?? null,
          requiredMinutesWatched: firstItem?.requiredMinutesWatched ?? null,
          sortOrder: 0,
        },
      })
    }
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
      where: { userId: user.id, isAlertEnabled: true, deletedAt: null },
      include: { game: true },
    })

    if (userGames.length === 0) continue

    let matchCount = 0

    for (const drop of activeDrops) {
      const dropGameName = normalize(drop.gameName)

      const matchedGame = userGames.find(
        (ug) => normalize(safeDecrypt(ug.game.name)) === dropGameName
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

      const dropItems = await prisma.dropItem.findMany({
        where: { twitchDropId: drop.id },
        orderBy: { sortOrder: "asc" },
      })

      const alertData = {
        userId: user.id,
        email: safeDecrypt(user.email!),
        gameName: drop.gameName,
        gameBoxArtUrl: drop.gameBoxArtUrl,
        gameSteamAppId: matchedGame.game.steamAppId,
        dropName: drop.campaignName,
        startAt: drop.startAt.toISOString(),
        endAt: drop.endAt.toISOString(),
        twitchUrl: "https://www.twitch.tv/drops/inventory",
        dropItems: dropItems.map((di) => ({
          name: di.name,
          rewardName: di.rewardName,
          rewardImageUrl: di.rewardImageUrl,
          requiredMinutesWatched: di.requiredMinutesWatched,
        })),
      }

      try {
        await sendDropAlertDirect(alertData)
      } catch (e) {
        console.error("[sync] Échec envoi email:", e)
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

async function sendDropAlertDirect(data: AlertJobData) {
  const { sendDropAlert } = await import("../services/email")
  await sendDropAlert({
    to: data.email,
    gameName: data.gameName,
    gameBoxArtUrl: data.gameBoxArtUrl,
    gameSteamAppId: data.gameSteamAppId,
    dropName: data.dropName,
    startAt: new Date(data.startAt),
    endAt: new Date(data.endAt),
    twitchUrl: data.twitchUrl,
    dropItems: data.dropItems,
  })
}



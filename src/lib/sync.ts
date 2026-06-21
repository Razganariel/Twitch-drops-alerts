import "./logger"
import { prisma } from "@/lib/prisma"
import { getActiveDropCampaigns, getDropCampaignDetails } from "@/services/twitch"
import { getSyncGqlToken } from "@/services/sync-account"
import { parseTwitchDate } from "@/lib/timezone"
import { normalize } from "@/lib/utils"
import { safeDecrypt, encrypt, decrypt } from "@/lib/encryption"
import { sendDropAlert } from "@/services/email"
import { getSteamLibrary, getSteamLogoUrl } from "@/services/steam"

type DropItemData = {
  name: string
  rewardName: string | null
  rewardImageUrl: string | null
  requiredMinutesWatched: number | null
}

type AlertJobData = {
  userId: string
  email: string
  gameName: string
  gameBoxArtUrl: string | null
  gameSteamAppId: number | null
  dropName: string
  startAt: string
  endAt: string
  twitchUrl: string
  dropItems: DropItemData[]
}

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
      u.steamConnection
  )

  if (connectedUsers.length === 0) {
    console.log("[sync] Aucun utilisateur avec Steam connecté")
    return { ok: true, count: 0 }
  }

  const now = new Date()
  const DAY_MS = 86_400_000

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
    const sc = user.steamConnection!
    const lastSync = sc.lastSyncedAt?.getTime() ?? 0
    if (now.getTime() - lastSync >= DAY_MS) {
      console.log(`[sync] Synchro bibliothèque Steam pour l'utilisateur ${user.id}`)
      try {
        const apiKey = decrypt(sc.steamApiKey)
        const steamId = decrypt(sc.steamId)

        const rawGames = await getSteamLibrary(steamId, apiKey)

        const games = rawGames.filter((g) => {
          const lower = g.name.toLowerCase()
          return !lower.includes("demo") && !lower.includes("playtest")
        })

        const apiAppIds = new Set(games.map((g) => g.appid))

        const existingUserGames = await prisma.userGame.findMany({
          where: { userId: user.id },
          select: { gameId: true, game: { select: { id: true, steamAppId: true } } },
        })

        const existingSteamIds = new Set(existingUserGames.map((e) => e.game.steamAppId))

        const newGames = games.filter((g) => !existingSteamIds.has(g.appid))

        for (const game of games) {
          await prisma.game.upsert({
            where: { steamAppId: game.appid },
            update: {
              name: encrypt(game.name),
              logoUrl: getSteamLogoUrl(game.appid, game.img_logo_url),
            },
            create: {
              steamAppId: game.appid,
              name: encrypt(game.name),
              logoUrl: getSteamLogoUrl(game.appid, game.img_logo_url),
            },
          })
        }

        for (const game of newGames) {
          const dbGame = await prisma.game.findUnique({
            where: { steamAppId: game.appid },
          })
          if (dbGame) {
            await prisma.userGame.create({
              data: { userId: user.id, gameId: dbGame.id },
            })
          }
        }

        const removedEntries = existingUserGames.filter(
          (e) => !apiAppIds.has(e.game.steamAppId)
        )
        const removedGameIds = removedEntries.map((e) => e.game.id)

        if (removedGameIds.length > 0) {
          await prisma.userGame.deleteMany({
            where: { userId: user.id, gameId: { in: removedGameIds } },
          })

          const orphanedGames = await prisma.game.findMany({
            where: {
              id: { in: removedGameIds },
              userGames: { none: {} },
              alerts: { none: {} },
            },
          })

          if (orphanedGames.length > 0) {
            await prisma.game.deleteMany({
              where: { id: { in: orphanedGames.map((g) => g.id) } },
            })
          }
        }

        await prisma.steamConnection.update({
          where: { userId: user.id },
          data: { lastSyncedAt: now },
        })

        console.log(`[sync] Bibliothèque Steam OK: ${games.length} jeux, ${newGames.length} nouveaux, ${removedGameIds.length} retirés`)
      } catch (e) {
        console.error(`[sync] Échec synchro Steam pour l'utilisateur ${user.id}:`, e)
      }
    }

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

      const dropItems = await prisma.dropItem.findMany({
        where: { twitchDropId: drop.id },
        orderBy: { sortOrder: "asc" },
      })

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
        await sendDropAlert({
          to: safeDecrypt(user.email!),
          gameName: drop.gameName,
          gameBoxArtUrl: drop.gameBoxArtUrl,
          gameSteamAppId: matchedGame.game.steamAppId,
          dropName: drop.campaignName,
          startAt: drop.startAt,
          endAt: drop.endAt,
          twitchUrl: "https://www.twitch.tv/drops/inventory",
          dropItems: dropItems.map((di) => ({
            name: di.name,
            rewardName: di.rewardName,
            rewardImageUrl: di.rewardImageUrl,
            requiredMinutesWatched: di.requiredMinutesWatched,
          })),
        })
      } catch (e) {
        console.error("[sync] Échec envoi email:", e)
        continue
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

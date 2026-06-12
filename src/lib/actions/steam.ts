"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt, maskValue } from "@/lib/encryption"
import { getSteamLibrary, resolveSteamVanityUrl, getSteamLogoUrl } from "@/services/steam"

export type ConnectSteamResult = {
  ok: boolean
  message: string
  gameCount?: number
  steamId?: string
  needsReauth?: boolean
}

export async function connectSteam(
  _prevState: ConnectSteamResult | null,
  formData: FormData
): Promise<ConnectSteamResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" }

  const steamIdInput = formData.get("steamId") as string
  const username = formData.get("username") as string
  const apiKey = formData.get("apiKey") as string

  const existing = await prisma.steamConnection.findUnique({
    where: { userId: session.user.id },
  })

  try {
    let effectiveApiKey = apiKey
    if (!effectiveApiKey && existing) {
      effectiveApiKey = decrypt(existing.steamApiKey)
    }
    if (!effectiveApiKey) return { ok: false, message: "Clé API Steam requise" }

    let steamId: string | null = null

    if (username) {
      if (/^\d{17}$/.test(username.trim())) {
        steamId = username.trim()
      } else {
        steamId = await resolveSteamVanityUrl(username, effectiveApiKey)
      }
    } else if (steamIdInput) {
      steamId = steamIdInput
    } else if (existing?.steamId) {
      steamId = decrypt(existing.steamId)
    }

    if (!steamId) return { ok: false, message: "ID Steam requis" }

    const rawGames = await getSteamLibrary(steamId, effectiveApiKey)

    const games = rawGames.filter((g) => {
      const lower = g.name.toLowerCase()
      return !lower.includes("demo") && !lower.includes("playtest")
    })

    const apiAppIds = new Set(games.map((g) => g.appid))

    const existingUserGames = await prisma.userGame.findMany({
      where: { userId: session.user.id },
      select: { gameId: true, game: { select: { id: true, steamAppId: true } } },
    })

    const existingSteamIds = new Set(existingUserGames.map((e) => e.game.steamAppId))
    const beforeCount = existingSteamIds.size

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
          data: { userId: session.user.id, gameId: dbGame.id },
        })
      }
    }

    const removedEntries = existingUserGames.filter(
      (e) => !apiAppIds.has(e.game.steamAppId)
    )
    const removedGameIds = removedEntries.map((e) => e.game.id)
    const removedCount = removedEntries.length

    if (removedGameIds.length > 0) {
      await prisma.userGame.deleteMany({
        where: {
          userId: session.user.id,
          gameId: { in: removedGameIds },
        },
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

    const encryptedKey = encrypt(effectiveApiKey)

    await prisma.steamConnection.upsert({
      where: { userId: session.user.id },
      update: {
        steamId: encrypt(steamId),
        steamApiKey: encryptedKey,
        lastSyncedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        steamId: encrypt(steamId),
        steamApiKey: encryptedKey,
        lastSyncedAt: new Date(),
      },
    })

    const newCount = newGames.length
    let message: string
    if (beforeCount === 0) {
      message = `${games.length} jeux importés`
    } else {
      const parts: string[] = []
      if (newCount > 0) {
        parts.push(`${newCount} nouveau${newCount > 1 ? "x" : ""}`)
      }
      if (removedCount > 0) {
        parts.push(`${removedCount} retiré${removedCount > 1 ? "s" : ""}`)
      }
      message = parts.length > 0 ? parts.join(", ") : "Aucun changement"
    }
    return { ok: true, message, gameCount: games.length, steamId: maskValue(steamId) }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue"
    return {
      ok: false,
      message,
      needsReauth: existing ? message.includes("Clé API Steam invalide") : false,
    }
  }
}

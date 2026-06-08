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
    } else {
      steamId = steamIdInput || existing?.steamId || null
    }

    if (!steamId) return { ok: false, message: "ID Steam requis" }

    const games = await getSteamLibrary(steamId, effectiveApiKey)

    const existingSteamIds = new Set(
      (await prisma.userGame.findMany({
        where: { userId: session.user.id },
        select: { game: { select: { steamAppId: true } } },
      })).map((ug) => ug.game.steamAppId)
    )

    const beforeCount = existingSteamIds.size
    const newGames = games.filter((g) => !existingSteamIds.has(g.appid))

    for (const game of games) {
      await prisma.game.upsert({
        where: { steamAppId: game.appid },
        update: {
          name: game.name,
          logoUrl: getSteamLogoUrl(game.appid, game.img_logo_url),
        },
        create: {
          steamAppId: game.appid,
          name: game.name,
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

    const encryptedKey = encrypt(effectiveApiKey)

    await prisma.steamConnection.upsert({
      where: { userId: session.user.id },
      update: {
        steamId,
        steamApiKey: encryptedKey,
        lastSyncedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        steamId,
        steamApiKey: encryptedKey,
        lastSyncedAt: new Date(),
      },
    })

    const newCount = newGames.length
    const message = beforeCount === 0
      ? `${games.length} jeux importés`
      : newCount > 0
        ? `${newCount} nouveau${newCount > 1 ? "x" : ""} importé${newCount > 1 ? "s" : ""}`
        : "Aucun nouveau jeu"
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

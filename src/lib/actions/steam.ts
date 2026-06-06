"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSteamLibrary, resolveSteamVanityUrl, getSteamLogoUrl } from "@/services/steam"

export async function connectSteam(
  _prevState: { ok: boolean; message: string; gameCount?: number } | null,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" }

  const steamIdInput = formData.get("steamId") as string
  const username = formData.get("username") as string
  const apiKey = formData.get("apiKey") as string

  if (!apiKey) return { ok: false, message: "Clé API Steam requise" }

  try {
    let steamId: string | null = null

    if (username) {
      if (/^\d{17}$/.test(username.trim())) {
        steamId = username.trim()
      } else {
        steamId = await resolveSteamVanityUrl(username, apiKey)
      }
    } else {
      steamId = steamIdInput
    }

    if (!steamId) return { ok: false, message: username ? `Aucun profil Steam trouvé pour "${username}"` : "Pseudo ou ID Steam requis" }

    const games = await getSteamLibrary(steamId, apiKey)

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

    for (const game of games) {
      const dbGame = await prisma.game.findUnique({
        where: { steamAppId: game.appid },
      })
      if (dbGame) {
        await prisma.userGame.upsert({
          where: {
            userId_gameId: { userId: session.user.id, gameId: dbGame.id },
          },
          update: {},
          create: { userId: session.user.id, gameId: dbGame.id },
        })
      }
    }

    await prisma.steamConnection.upsert({
      where: { userId: session.user.id },
      update: {
        steamId,
        steamApiKey: apiKey,
        lastSyncedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        steamId,
        steamApiKey: apiKey,
        lastSyncedAt: new Date(),
      },
    })

    return { ok: true, message: "Bibliothèque synchronisée", gameCount: games.length }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}

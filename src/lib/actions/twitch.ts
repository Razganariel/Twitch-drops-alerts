"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFollowedStreams, refreshTwitchToken } from "@/services/twitch"

export async function syncFollowedGames() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" } as const

  const connection = await prisma.twitchConnection.findUnique({
    where: { userId: session.user.id },
  })

  if (!connection?.accessToken) {
    return { ok: false, message: "Twitch non connecté" } as const
  }

  let accessToken = connection.accessToken

  if (connection.expiresAt && connection.expiresAt < new Date()) {
    if (!connection.refreshToken) {
      return { ok: false, message: "Token expiré, reconnecte Twitch" } as const
    }

    const tokens = await refreshTwitchToken(
      connection.refreshToken,
      process.env.TWITCH_CLIENT_ID!,
      process.env.TWITCH_CLIENT_SECRET!
    )

    accessToken = tokens.access_token

    await prisma.twitchConnection.update({
      where: { userId: session.user.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    })
  }

  const streams = await getFollowedStreams(accessToken, process.env.TWITCH_CLIENT_ID!)

  const seen = new Set<string>()

  for (const stream of streams) {
    if (seen.has(stream.gameId)) continue
    seen.add(stream.gameId)

    await prisma.twitchFollowedGame.upsert({
      where: {
        userId_twitchGameId: {
          userId: session.user.id,
          twitchGameId: stream.gameId,
        },
      },
      update: {
        gameName: stream.gameName,
        boxArtUrl: stream.thumbnailUrl,
      },
      create: {
        userId: session.user.id,
        twitchGameId: stream.gameId,
        gameName: stream.gameName,
        boxArtUrl: stream.thumbnailUrl,
      },
    })
  }

  return {
    ok: true,
    message: `${seen.size} jeux synchronisés depuis tes chaînes suivies`,
  } as const
}

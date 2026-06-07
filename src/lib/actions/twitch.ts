"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseTwitchDate } from "@/lib/timezone"
import {
  getFollowedStreams,
  getActiveDropCampaigns,
  refreshTwitchToken,
  startDeviceFlow,
  pollDeviceFlow,
  refreshGqlToken,
} from "@/services/twitch"

async function getValidToken(userId: string) {
  const connection = await prisma.twitchConnection.findUnique({
    where: { userId },
  })

  if (!connection?.accessToken) return null

  let accessToken = connection.accessToken

  if (connection.expiresAt && connection.expiresAt < new Date()) {
    if (!connection.refreshToken) return null

    const tokens = await refreshTwitchToken(
      connection.refreshToken,
      process.env.TWITCH_CLIENT_ID!,
      process.env.TWITCH_CLIENT_SECRET!
    )

    accessToken = tokens.access_token

    await prisma.twitchConnection.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    })
  }

  return accessToken
}

export async function syncFollowedGames() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" } as const

  const connection = await prisma.twitchConnection.findUnique({
    where: { userId: session.user.id },
  })

  if (!connection?.twitchId) return { ok: false, message: "Twitch non connecté" } as const

  const accessToken = await getValidToken(session.user.id)
  if (!accessToken) return { ok: false, message: "Token expiré, reconnecte Twitch" } as const

  const streams = await getFollowedStreams(accessToken, process.env.TWITCH_CLIENT_ID!, connection.twitchId)

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

async function getValidGqlToken(userId: string) {
  const connection = await prisma.twitchConnection.findUnique({
    where: { userId },
  })

  if (!connection?.gqlAccessToken) return null

  let gqlAccessToken = connection.gqlAccessToken

  if (connection.gqlTokenExpiresAt && connection.gqlTokenExpiresAt < new Date()) {
    if (!connection.gqlRefreshToken) return null

    try {
      const tokens = await refreshGqlToken(connection.gqlRefreshToken)

      gqlAccessToken = tokens.access_token

      await prisma.twitchConnection.update({
        where: { userId },
        data: {
          gqlAccessToken: tokens.access_token,
          gqlRefreshToken: tokens.refresh_token,
          gqlTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })
    } catch (e) {
      console.error("GQL token refresh failed, clearing tokens:", e)
      await prisma.twitchConnection.update({
        where: { userId },
        data: {
          gqlAccessToken: null,
          gqlRefreshToken: null,
          gqlTokenExpiresAt: null,
        },
      })
      return null
    }
  }

  return gqlAccessToken
}

export async function startGqlDeviceFlow() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" } as const

  const flow = await startDeviceFlow()

  return {
    ok: true,
    deviceCode: flow.device_code,
    userCode: flow.user_code,
    verificationUri: flow.verification_uri,
    interval: flow.interval,
  } as const
}

export async function checkGqlDeviceFlow(deviceCode: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" } as const

  const result = await pollDeviceFlow(deviceCode)

  if (!result) {
    return { ok: false, pending: true } as const
  }

  const expiresInSeconds = result.expires_in ?? 14400
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

  await prisma.twitchConnection.upsert({
    where: { userId: session.user.id },
    update: {
      gqlAccessToken: result.access_token,
      gqlRefreshToken: result.refresh_token,
      gqlTokenExpiresAt: expiresAt,
    },
    create: {
      userId: session.user.id,
      gqlAccessToken: result.access_token,
      gqlRefreshToken: result.refresh_token,
      gqlTokenExpiresAt: expiresAt,
    },
  })

  return { ok: true, pending: false } as const
}

export async function syncActiveDrops(
  _prevState: { ok: boolean; message: string; needsGqlAuth?: boolean } | null,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" }

  const timezone = (formData.get("timezone") as string) || "UTC"

  await prisma.user.update({
    where: { id: session.user.id },
    data: { timezone },
  })

      const gqlToken = await getValidGqlToken(session.user.id)

  if (!gqlToken) {
    return {
      ok: false,
      needsGqlAuth: true,
      message: "Autorisation GQL requise",
    }
  }

  let campaigns: Awaited<ReturnType<typeof getActiveDropCampaigns>>
  try {
    campaigns = await getActiveDropCampaigns(gqlToken)
  } catch (e) {
    if (e instanceof Error && e.message.includes("failed integrity check")) {
      await prisma.twitchConnection.update({
        where: { userId: session.user.id },
        data: { gqlAccessToken: null, gqlRefreshToken: null, gqlTokenExpiresAt: null },
      })
      return {
        ok: false,
        needsGqlAuth: true,
        message: "Token invalide, merci de ré-autoriser",
      }
    }
    throw e
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

  let count = 0

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
        startAt: parseTwitchDate(campaign.startAt, timezone),
        endAt: parseTwitchDate(campaign.endAt, timezone),
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
        startAt: parseTwitchDate(campaign.startAt, timezone),
        endAt: parseTwitchDate(campaign.endAt, timezone),
        isActive: true,
      },
    })

    count++
  }

  return {
    ok: true,
    message: `${count} campagne${count > 1 ? "s" : ""} de drops synchronisée${count > 1 ? "s" : ""}`,
  }
}

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { normalize } from "@/lib/utils"
import { sendDropAlert } from "@/services/email"

export async function matchDrops() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" } as const

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.email) return { ok: false, message: "Aucun email sur le compte" } as const

  const userGames = await prisma.userGame.findMany({
    where: { userId: session.user.id, isAlertEnabled: true, deletedAt: null },
    include: { game: true },
  })

  if (userGames.length === 0) {
    return { ok: false, message: "Aucun jeu Steam importé" } as const
  }

  const activeDrops = await prisma.twitchDrop.findMany({
    where: { isActive: true },
  })

  if (activeDrops.length === 0) {
    return { ok: false, message: "Aucun drop actif en base" } as const
  }

  let matchCount = 0

  for (const drop of activeDrops) {
    const dropGameName = normalize(drop.gameName)

    const matchedGame = userGames.find((ug) => {
      const gameName = normalize(ug.game.name)
      return gameName === dropGameName
    })

    if (!matchedGame) continue

    const existing = await prisma.alert.findFirst({
      where: {
        userId: session.user.id,
        gameId: matchedGame.game.id,
        dropId: drop.id,
      },
    })

    if (existing) continue

    await prisma.alert.create({
      data: {
        userId: session.user.id,
        gameId: matchedGame.game.id,
        dropId: drop.id,
      },
    })

    const dropItems = await prisma.dropItem.findMany({
      where: { twitchDropId: drop.id },
      orderBy: { sortOrder: "asc" },
    })

    try {
      await sendDropAlert({
        to: user.email,
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
      console.error("[matching] Échec envoi email:", e)
    }

    matchCount++
  }

  revalidatePath("/dashboard")
  return {
    ok: true,
    message: `${matchCount} alerte${matchCount > 1 ? "s" : ""} générée${matchCount > 1 ? "s" : ""}`,
  } as const
}

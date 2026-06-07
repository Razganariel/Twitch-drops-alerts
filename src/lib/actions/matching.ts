"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { alertQueue } from "@/lib/queue"

function normalize(name: string) {
  return name.toLowerCase().trim()
}

export async function matchDrops() {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" } as const

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.email) return { ok: false, message: "Aucun email sur le compte" } as const

  const userGames = await prisma.userGame.findMany({
    where: { userId: session.user.id },
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
      return (
        gameName === dropGameName ||
        gameName.includes(dropGameName) ||
        dropGameName.includes(gameName)
      )
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

    try {
      await alertQueue.add("send-alert", {
        userId: session.user.id,
        email: user.email,
        gameName: drop.gameName,
        dropName: drop.campaignName,
        endAt: drop.endAt.toISOString(),
        twitchUrl: `https://www.twitch.tv/drops/inventory`,
      })
    } catch (e) {
      console.error("Failed to enqueue alert email:", e)
    }

    matchCount++
  }

  return {
    ok: true,
    message: `${matchCount} alerte${matchCount > 1 ? "s" : ""} générée${matchCount > 1 ? "s" : ""}`,
  } as const
}

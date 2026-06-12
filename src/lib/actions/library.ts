"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/encryption"
import { getGameDetails, getSteamLogoUrl } from "@/services/steam"

export async function toggleGameAlert(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const gameId = formData.get("gameId") as string
  const enabled = formData.get("enabled") === "true"

  await prisma.userGame.update({
    where: { userId_gameId: { userId: session.user.id, gameId } },
    data: { isAlertEnabled: enabled },
  })

  revalidatePath("/dashboard/library")
}

export async function softDeleteGame(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const gameId = formData.get("gameId") as string

  await prisma.userGame.update({
    where: { userId_gameId: { userId: session.user.id, gameId } },
    data: { deletedAt: new Date() },
  })

  revalidatePath("/dashboard/library")
}

export async function restoreGame(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const gameId = formData.get("gameId") as string

  await prisma.userGame.update({
    where: { userId_gameId: { userId: session.user.id, gameId } },
    data: { deletedAt: null },
  })

  revalidatePath("/dashboard/library")
}

export async function toggleAllAlerts(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const enabled = formData.get("enabled") === "true"

  await prisma.userGame.updateMany({
    where: { userId: session.user.id, deletedAt: null },
    data: { isAlertEnabled: enabled },
  })

  revalidatePath("/dashboard/library")
}

export async function addGameToLibrary(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Non authentifié" }

  const steamAppId = Number(formData.get("steamAppId"))
  if (!steamAppId) return { error: "ID de jeu invalide" }

  const details = await getGameDetails(steamAppId)
  if (!details) return { error: "Jeu introuvable" }

  const existing = await prisma.userGame.findFirst({
    where: {
      userId: session.user.id,
      game: { steamAppId },
    },
    include: { game: true },
  })

  if (existing) {
    if (existing.deletedAt) {
      await prisma.userGame.update({
        where: { userId_gameId: { userId: existing.userId, gameId: existing.gameId } },
        data: { deletedAt: null },
      })
    }
    revalidatePath("/dashboard/library")
    return { success: true }
  }

  const game = await prisma.game.upsert({
    where: { steamAppId },
    update: {},
    create: {
      steamAppId,
      name: encrypt(details.name),
      logoUrl: getSteamLogoUrl(steamAppId),
    },
  })

  await prisma.userGame.create({
    data: {
      userId: session.user.id,
      gameId: game.id,
      isAlertEnabled: true,
    },
  })

  revalidatePath("/dashboard/library")
  return { success: true }
}

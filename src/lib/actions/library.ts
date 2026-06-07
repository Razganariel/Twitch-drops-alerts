"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

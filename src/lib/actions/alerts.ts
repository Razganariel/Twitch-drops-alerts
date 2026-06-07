"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function markAlertAsRead(alertId: string) {
  const session = await auth()
  if (!session?.user?.id) return

  const alert = await prisma.alert.findUnique({ where: { id: alertId } })
  if (!alert || alert.userId !== session.user.id) return

  await prisma.alert.update({
    where: { id: alertId },
    data: { status: "READ" },
  })

  revalidatePath("/dashboard/alerts")
}

export async function markAllAlertsAsRead() {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.alert.updateMany({
    where: { userId: session.user.id, status: "SENT" },
    data: { status: "READ" },
  })

  revalidatePath("/dashboard/alerts")
}

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function updateCheckInterval(_prevState: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" }

  const interval = parseInt(formData.get("interval") as string, 10)
  if (![15, 30, 60, 240, 720, 1440].includes(interval)) {
    return { ok: false, message: "Intervalle invalide" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { checkInterval: interval },
  })

  revalidatePath("/dashboard/settings")
  return { ok: true, message: "Intervalle mis à jour" }
}

export async function updateDashboardPreferences(
  _prevState: unknown,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" }

  const filter = formData.get("dashboardFilter") as string
  const view = formData.get("dashboardView") as string

  if (filter !== "ALL" && filter !== "MATCH") {
    return { ok: false, message: "Filtre invalide" }
  }
  if (view !== "GRID" && view !== "LIST") {
    return { ok: false, message: "Vue invalide" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { dashboardFilter: filter, dashboardView: view },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/settings")
  return { ok: true, message: "Préférences mises à jour" }
}

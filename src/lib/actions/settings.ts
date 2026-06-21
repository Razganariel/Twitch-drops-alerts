"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { stripHtml } from "@/lib/schemas/helpers"
import { checkIntervalSchema, dashboardPreferencesSchema } from "@/lib/schemas/settings"

export async function updateCheckInterval(_prevState: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" }

  const parsed = checkIntervalSchema.safeParse({ interval: formData.get("interval") })
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { ok: false, message: firstError ?? "Intervalle invalide" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { checkInterval: parsed.data.interval },
  })

  revalidatePath("/dashboard/settings")
  return { ok: true, message: "Intervalle mis à jour" }
}

const timezoneSchema = z.string().min(1).max(50).transform(stripHtml)

export async function updateTimezone(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" }

  const parsed = timezoneSchema.safeParse(formData.get("timezone"))
  if (!parsed.success) return { ok: false, message: "Fuseau invalide" }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { timezone: parsed.data },
  })

  revalidatePath("/dashboard/settings")
  return { ok: true, message: "Fuseau horaire mis à jour" }
}

export async function updateDashboardPreferences(
  _prevState: unknown,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" }

  const parsed = dashboardPreferencesSchema.safeParse({
    dashboardFilter: formData.get("dashboardFilter"),
    dashboardView: formData.get("dashboardView"),
  })
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return { ok: false, message: firstError ?? "Préférences invalides" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/settings")
  return { ok: true, message: "Préférences mises à jour" }
}

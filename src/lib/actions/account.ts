"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { maskValue, safeDecrypt } from "@/lib/encryption"
import { createOtp, sendOtpEmail, verifyOtp } from "@/lib/otp"

export async function requestOtp(purpose: "download" | "delete") {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non connecté" } as const

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })
  if (!user?.email) return { ok: false, message: "Aucun email sur le compte" } as const

  const email = safeDecrypt(user.email)
  const code = await createOtp(session.user.id, purpose)
  await sendOtpEmail(email, code, purpose)

  return { ok: true } as const
}

export async function downloadUserData(code: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non connecté" } as const

  const valid = await verifyOtp(session.user.id, "download", code)
  if (!valid) return { ok: false, message: "Code invalide ou expiré" } as const

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      twitchConnection: true,
      steamConnection: true,
      userGames: {
        include: { game: true },
      },
      alerts: {
        orderBy: { sentAt: "desc" },
      },
    },
  })
  if (!user) return { ok: false, message: "Utilisateur introuvable" } as const

  const data = {
    email: user.email ? safeDecrypt(user.email) : null,
    name: user.name ? safeDecrypt(user.name) : null,
    connections: {
      twitch: user.twitchConnection
        ? { twitchLogin: user.twitchConnection.twitchLogin ? safeDecrypt(user.twitchConnection.twitchLogin) : null }
        : null,
      steam: user.steamConnection
        ? { steamId: maskValue(safeDecrypt(user.steamConnection.steamId)) }
        : null,
    },
    gameLibrary: user.userGames.map((ug) => ({
      name: safeDecrypt(ug.game.name),
      steamAppId: ug.game.steamAppId,
      alertsEnabled: ug.isAlertEnabled,
    })),
    alertsHistory: user.alerts.map((a) => ({
      campaignName: a.dropId,
      sentAt: a.sentAt.toISOString(),
      status: a.status,
    })),
  }

  return { ok: true, data } as const
}

export async function deleteAccount(code: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non connecté" } as const

  const valid = await verifyOtp(session.user.id, "delete", code)
  if (!valid) return { ok: false, message: "Code invalide ou expiré" } as const

  await prisma.user.delete({ where: { id: session.user.id } })

  return { ok: true } as const
}

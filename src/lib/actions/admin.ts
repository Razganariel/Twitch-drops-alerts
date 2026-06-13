"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, safeDecrypt } from "@/lib/encryption"
import { testTwitchClientId, testTwitchCredentials, testResend, testSmtp } from "@/services/health"
import { setMaintenanceValue } from "@/lib/maintenance"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Non authentifié")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (!user?.isAdmin) throw new Error("Accès refusé")
}

export type SettingValue = {
  key: string
  value: string
  updatedAt: Date | null
}

export async function getSettings(): Promise<SettingValue[]> {
  await requireAdmin()
  const settings = await prisma.appSetting.findMany()
  return settings.map((s) => ({
    key: s.key,
    value: safeDecrypt(s.value),
    updatedAt: s.updatedAt,
  }))
}

export async function saveSetting(key: string, value: string) {
  await requireAdmin()
  const encrypted = encrypt(value)
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: encrypted },
    create: { key, value: encrypted },
  })
}

export async function testSetting(key: string) {
  await requireAdmin()

  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    select: { email: true },
  })
  const testEmail = safeDecrypt(user!.email!)

  const settings = await prisma.appSetting.findMany()
  const getVal = (k: string) =>
    settings.find((s) => s.key === k)?.value ?? ""

  switch (key) {
    case "TWITCH_CLIENT_ID": {
      const clientId = getVal("TWITCH_CLIENT_ID")
      if (!clientId) return { ok: false, message: "Client ID non configuré" }
      return testTwitchClientId(safeDecrypt(clientId))
    }
    case "TWITCH_CLIENT_SECRET": {
      const rawClientId = getVal("TWITCH_CLIENT_ID") || (process.env.TWITCH_CLIENT_ID ?? "")
      const rawClientSecret = getVal("TWITCH_CLIENT_SECRET")
      if (!rawClientSecret) return { ok: false, message: "Client Secret non configuré" }
      return testTwitchCredentials(
        safeDecrypt(rawClientId),
        safeDecrypt(rawClientSecret)
      )
    }
    case "RESEND_API_KEY": {
      const rawApiKey = getVal("RESEND_API_KEY") || (process.env.RESEND_API_KEY ?? "")
      if (!rawApiKey) return { ok: false, message: "Clé Resend non configurée" }
      return testResend(safeDecrypt(rawApiKey), testEmail)
    }
    case "SMTP": {
      const rawHost = getVal("SMTP_HOST") || (process.env.SMTP_HOST ?? "")
      const rawPort = getVal("SMTP_PORT") || (process.env.SMTP_PORT ?? "587")
      const rawUser = getVal("SMTP_USER") || (process.env.SMTP_USER ?? "")
      const rawPass = getVal("SMTP_PASS") || (process.env.SMTP_PASS ?? "")
      if (!rawHost || !rawUser) return { ok: false, message: "SMTP non configuré" }
      return testSmtp(
        safeDecrypt(rawHost),
        Number(safeDecrypt(rawPort)),
        safeDecrypt(rawUser),
        rawPass ? safeDecrypt(rawPass) : "",
        testEmail
      )
    }
    default:
      return { ok: false, message: "Test non disponible" }
  }
}

export async function getEnvSettings(): Promise<{ key: string; label: string; value: string }[]> {
  await requireAdmin()
  const keys = [
    { key: "DATABASE_URL", label: "URL de la base de données" },
    { key: "REDIS_URL", label: "URL Redis" },
  ]
  return keys.map(({ key, label }) => {
    const raw = process.env[key] ?? ""
    const value = raw ? maskEnvUrl(raw) : ""
    return { key, label, value }
  })
}

function maskEnvUrl(value: string): string {
  try {
    const url = new URL(value)
    if (url.password) url.password = "******"
    if (url.username) url.username = "******"
    return url.toString()
  } catch {
    if (value.length > 8) return value.slice(0, 4) + "******" + value.slice(-4)
    return "******"
  }
}

export async function toggleMaintenance() {
  await requireAdmin()

  const current = await prisma.appSetting.findUnique({
    where: { key: "maintenance" },
  })

  const newValue = current?.value === "true" ? "false" : "true"

  if (current) {
    await prisma.appSetting.update({
      where: { key: "maintenance" },
      data: { value: newValue },
    })
  } else {
    await prisma.appSetting.create({
      data: { key: "maintenance", value: newValue },
    })
  }

  setMaintenanceValue(newValue)

  return { active: newValue === "true" }
}

import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { hashValue } from "@/lib/encryption"

const OTP_LENGTH = 6
const OTP_TTL_MS = 10 * 60 * 1000

function generateCode(): string {
  const code = crypto.randomInt(0, 10 ** OTP_LENGTH)
  return code.toString().padStart(OTP_LENGTH, "0")
}

export async function createOtp(userId: string, purpose: string): Promise<string> {
  const code = generateCode()

  await prisma.otpCode.deleteMany({
    where: { userId, purpose, expiresAt: { lt: new Date() } },
  })

  const expiresAt = new Date(Date.now() + OTP_TTL_MS)
  await prisma.otpCode.create({
    data: {
      userId,
      codeHash: hashValue(code),
      purpose,
      expiresAt,
    },
  })

  return code
}

export async function verifyOtp(userId: string, purpose: string, code: string): Promise<boolean> {
  const codeHash = hashValue(code)

  const record = await prisma.otpCode.findFirst({
    where: { userId, purpose, codeHash, expiresAt: { gt: new Date() } },
  })

  if (!record) return false

  await prisma.otpCode.delete({ where: { id: record.id } })
  return true
}

export async function sendOtpEmail(email: string, code: string, purpose: string) {
  const { sendEmail } = await import("@/services/email")
  const subject = purpose === "delete"
    ? "Code de confirmation — Suppression de compte"
    : "Code de confirmation — Téléchargement des données"
  const text = `Tu as demandé ${
    purpose === "delete"
      ? "la suppression de ton compte"
      : "le téléchargement de tes données"
  } sur Twitch Drops Alerts.

Voici ton code de confirmation : ${code}

Ce code expire dans 10 minutes.

Si tu n'es pas à l'origine de cette demande, ignore cet email.`

  await sendEmail({ to: email, subject, text })
}

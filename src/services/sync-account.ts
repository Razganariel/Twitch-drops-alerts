import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/encryption"
import { refreshGqlToken } from "@/services/twitch"

const SERVICE_NAME = "twitch-gql"

export async function getSyncGqlToken(): Promise<string | null> {
  const account = await prisma.syncAccount.findUnique({
    where: { service: SERVICE_NAME },
  })

  if (!account?.accessToken) return null

  let accessToken = decrypt(account.accessToken)

  if (account.expiresAt && account.expiresAt < new Date()) {
    if (!account.refreshToken) {
      await alertSyncTokenExpired()
      return null
    }

    const refreshToken = decrypt(account.refreshToken)

    try {
      const tokens = await refreshGqlToken(refreshToken, process.env.TWITCH_CLIENT_SECRET)

      accessToken = tokens.access_token

      await prisma.syncAccount.upsert({
        where: { service: SERVICE_NAME },
        update: {
          accessToken: encrypt(tokens.access_token),
          refreshToken: encrypt(tokens.refresh_token),
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 14400) * 1000),
        },
        create: {
          service: SERVICE_NAME,
          accessToken: encrypt(tokens.access_token),
          refreshToken: encrypt(tokens.refresh_token),
          expiresAt: new Date(Date.now() + (tokens.expires_in ?? 14400) * 1000),
        },
      })
    } catch (e) {
      console.error("[sync-account] Échec du refresh GQL, token effacé:", e)
      await prisma.syncAccount.upsert({
        where: { service: SERVICE_NAME },
        update: {
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        },
        create: {
          service: SERVICE_NAME,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        },
      })
      await alertSyncTokenExpired()
      return null
    }
  }

  return accessToken
}

async function alertSyncTokenExpired() {
  const { sendEmail } = await import("@/services/email")
  const to = process.env.ADMIN_EMAIL ?? "twitchdropsalerts@free.fr"
  const subject = "⚠️ Token de synchronisation Twitch expiré"
  const text = `Le token GQL du compte de service a expiré et n'a pas pu être renouvelé.
La synchronisation automatique des drops est interrompue.

Pour le rétablir, reconnecte le compte de service :
  npm run setup:sync-account

— Twitch Drops Alerts`

  try {
    await sendEmail({ to, subject, text })
  } catch (e) {
    console.error("[sync-account] Échec envoi alerte email:", e)
  }
}

import { prisma } from "@/lib/prisma"
import { exchangeTwitchCode, getTwitchUserId } from "@/services/twitch"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error || !code || !state) {
    redirect("/dashboard/connections?twitch=error")
  }

  const connection = await prisma.twitchConnection.findUnique({
    where: { userId: state },
  })

  if (!connection?.clientSecret) {
    redirect("/dashboard/connections?twitch=missing_secret")
  }

  const redirectUri = `${process.env.AUTH_URL ?? "http://localhost:3000"}/api/connections/twitch/callback`

  try {
    const tokens = await exchangeTwitchCode(
      code,
      connection.clientId,
      connection.clientSecret,
      redirectUri
    )

    const userData = await getTwitchUserId(tokens.access_token, connection.clientId)

    await prisma.twitchConnection.update({
      where: { userId: state },
      data: {
        twitchId: userData.id,
        twitchLogin: userData.login,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    })
  } catch {
    redirect("/dashboard/connections?twitch=token_error")
  }

  redirect("/dashboard/connections?twitch=success")
}

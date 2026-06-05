import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTwitchAuthUrl } from "@/services/twitch"
import { redirect } from "next/navigation"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const connection = await prisma.twitchConnection.findUnique({
    where: { userId: session.user.id },
  })

  if (!connection?.clientId) {
    return Response.json(
      { error: "Configure d'abord ton Client ID Twitch" },
      { status: 400 }
    )
  }

  const redirectUri = `${process.env.AUTH_URL ?? "http://localhost:3000"}/api/connections/twitch/callback`
  const url = getTwitchAuthUrl(connection.clientId, redirectUri, session.user.id)

  redirect(url)
}

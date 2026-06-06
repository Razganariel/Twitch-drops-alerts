import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TwitchConnectionCard } from "./twitch-card"
import { SteamConnectionCard } from "./steam-card"

const twitchMessages: Record<string, string> = {
  success: "Connexion Twitch réussie",
  error: "Connexion Twitch annulée",
  missing_secret: "Client Secret Twitch manquant",
  token_error: "Erreur lors de l'échange du token Twitch",
}

export default async function ConnectionsPage(props: {
  searchParams?: Promise<{ twitch?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const searchParams = await props.searchParams
  const twitchMessage = searchParams?.twitch ? twitchMessages[searchParams.twitch] : null

  const [twitchConnection, steamConnection, userGamesCount, followedGamesCount] = await Promise.all([
    prisma.twitchConnection.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.steamConnection.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.userGame.count({
      where: { userId: session.user.id },
    }),
    prisma.twitchFollowedGame.count({
      where: { userId: session.user.id },
    }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Connexions</h1>
      <p className="text-muted-foreground">
        Gérez vos connexions aux plateformes de jeux.
      </p>
      {twitchMessage && (
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {twitchMessage}
        </p>
      )}
      <TwitchConnectionCard
        connection={
          twitchConnection
            ? {
                clientId: twitchConnection.clientId,
                twitchLogin: twitchConnection.twitchLogin,
                expiresAt: twitchConnection.expiresAt,
                hasAccessToken: !!twitchConnection.accessToken,
                followedGamesCount,
              }
            : null
        }
      />
      <SteamConnectionCard
        connection={
          steamConnection
            ? {
                steamId: steamConnection.steamId,
                lastSyncedAt: steamConnection.lastSyncedAt,
                gameCount: userGamesCount,
              }
            : null
        }
      />
    </div>
  )
}

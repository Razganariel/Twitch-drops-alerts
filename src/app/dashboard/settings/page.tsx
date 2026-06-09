import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsForm } from "./settings-form"
import { DashboardPreferencesForm } from "./dashboard-preferences-form"
import { decrypt, maskValue } from "@/lib/encryption"
import { TwitchConnectionCard } from "./twitch-card"
import { SteamConnectionCard } from "./steam-card"

const twitchMessages: Record<string, string> = {
  success: "Connexion Twitch réussie",
  error: "Connexion Twitch annulée",
  missing_secret: "Client Secret Twitch manquant",
  token_error: "Erreur lors de l'échange du token Twitch",
}

export default async function SettingsPage(props: {
  searchParams?: Promise<{ twitch?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const searchParams = await props.searchParams
  const twitchMessage = searchParams?.twitch ? twitchMessages[searchParams.twitch] : null

  const [
    user,
    twitchConnection,
    steamConnection,
    userGamesCount,
    followedGamesCount,
    activeDropsCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { checkInterval: true, lastMatchAt: true, dashboardFilter: true, dashboardView: true },
    }),
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
    prisma.twitchDrop.count({
      where: { isActive: true },
    }),
  ])

  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Paramètres</h1>

      {twitchMessage && (
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {twitchMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Synchronisation automatique</CardTitle>
          <CardDescription>
            Fréquence à laquelle le système vérifie les nouveaux drops et les
            compare à ta bibliothèque Steam. Dernière vérification :{" "}
            {user.lastMatchAt
              ? new Date(user.lastMatchAt).toLocaleString("fr-FR")
              : "jamais"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm currentInterval={user.checkInterval} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Affichage du dashboard</CardTitle>
          <CardDescription>
            Personnalise le filtre et la vue par défaut de la page d&apos;accueil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardPreferencesForm
            currentFilter={user.dashboardFilter}
            currentView={user.dashboardView}
          />
        </CardContent>
      </Card>

      <TwitchConnectionCard
        connection={
          twitchConnection
            ? {
                twitchLogin: twitchConnection.twitchLogin ? decrypt(twitchConnection.twitchLogin) : null,
                hasAccessToken: !!twitchConnection.accessToken,
                followedGamesCount,
                activeDropsCount,
              }
            : null
        }
      />

      <SteamConnectionCard
        connection={
          steamConnection
            ? {
                steamId: maskValue(decrypt(steamConnection.steamId)),
                lastSyncedAt: steamConnection.lastSyncedAt,
                gameCount: userGamesCount,
              }
            : null
        }
      />
    </div>
  )
}

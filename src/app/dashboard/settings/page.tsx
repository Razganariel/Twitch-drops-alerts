import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsForm } from "./settings-form"
import { DashboardPreferencesForm } from "./dashboard-preferences-form"
import { decrypt, maskValue, safeDecrypt } from "@/lib/encryption"
import { TwitchConnectionCard } from "./twitch-card"
import { SteamConnectionCard } from "./steam-card"
import { DownloadCard } from "./download-card"
import { DeleteAccountCard } from "./delete-card"
import { TimezoneSelector } from "./timezone-selector"
import { formatDate } from "@/lib/timezone"

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
    syncCooldownSetting,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { checkInterval: true, lastMatchAt: true, timezone: true, dashboardFilter: true, dashboardView: true },
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
    prisma.appSetting.findUnique({
      where: { key: "SYNC_COOLDOWN_SECONDS" },
    }),
  ])

  const syncCooldownMs = (Number(syncCooldownSetting?.value ? safeDecrypt(syncCooldownSetting.value) : 300)) * 1000

  if (!user) redirect("/login")

  const tz = user.timezone ?? "UTC"

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
              ? formatDate(user.lastMatchAt, tz)
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

      <TimezoneSelector currentTimezone={user.timezone ?? null} />

      <TwitchConnectionCard
        syncCooldownMs={syncCooldownMs}
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
        syncCooldownMs={syncCooldownMs}
        timezone={tz}
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

      <DownloadCard />
      <DeleteAccountCard />
    </div>
  )
}

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"
import { MatchSection } from "./match-section"
import { ConnectionBanner } from "./connection-banner"
import { CampaignCard } from "./campaign-card"
import { CampaignRow } from "./campaign-row"

type CampaignData = {
  id: string
  campaignId: string
  gameName: string
  gameBoxArtUrl: string | null
  campaignName: string
  startAt: string
  endAt: string
  dropItems: { id: string; name: string; rewardName: string | null; rewardImageUrl: string | null; requiredMinutesWatched: number | null }[]
  alert: { id: string; status: string } | null
}

export default async function DashboardPage(props: {
  searchParams?: Promise<{ view?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const searchParams = await props.searchParams
  const view = searchParams?.view === "list" ? "list" : "grid"

  const userId = session.user.id

  const [user, twitchConn, steamConn, activeDrops, totalAlerts, userGamesCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { checkInterval: true, lastMatchAt: true, timezone: true },
      }),
      prisma.twitchConnection.findUnique({ where: { userId } }),
      prisma.steamConnection.findUnique({ where: { userId } }),
      prisma.twitchDrop.findMany({
        where: { isActive: true },
        include: {
          dropItems: { orderBy: { sortOrder: "asc" } },
          alerts: { where: { userId } },
        },
        orderBy: { endAt: "asc" },
      }),
      prisma.alert.count({ where: { userId } }),
      prisma.alert.count({ where: { userId, status: "SENT" } }),
      prisma.userGame.count({ where: { userId } }),
    ])

  if (!user) redirect("/login")

  const sorted = [...activeDrops].sort((a, b) => a.gameName.localeCompare(b.gameName))
  const campaigns: CampaignData[] = sorted.map((drop) => ({
    id: drop.id,
    campaignId: drop.campaignId,
    gameName: drop.gameName,
    gameBoxArtUrl: drop.gameBoxArtUrl,
    campaignName: drop.campaignName,
    startAt: drop.startAt.toISOString(),
    endAt: drop.endAt.toISOString(),
    dropItems: drop.dropItems.map((item) => ({
      id: item.id,
      name: item.name,
      rewardName: item.rewardName,
      rewardImageUrl: item.rewardImageUrl,
      requiredMinutesWatched: item.requiredMinutesWatched,
    })),
    alert: drop.alerts[0]
      ? { id: drop.alerts[0].id, status: drop.alerts[0].status }
      : null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue, {session.user.name ?? session.user.email}
          </p>
        </div>
      </div>

      <ConnectionBanner
        twitchConnected={!!twitchConn?.accessToken}
        gqlConnected={!!twitchConn?.gqlAccessToken}
        steamConnected={!!steamConn}
        activeCampaigns={activeDrops.length}
        syncedGames={userGamesCount}
        steamLastSyncedAt={steamConn?.lastSyncedAt?.toISOString() ?? null}
      />

      <div className="flex items-center justify-between gap-4">
        <MatchSection
          hasSteam={!!steamConn}
          hasTwitch={!!twitchConn?.accessToken}
          alertCount={totalAlerts}
        />

        <div className="flex items-center gap-1 rounded-md border p-0.5 shrink-0">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            asChild
          >
            <Link href="/dashboard?view=grid" title="Vue grille">
              <LayoutGrid className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            asChild
          >
            <Link href="/dashboard?view=list" title="Vue liste">
              <List className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Drops actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aucun drop actif pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}

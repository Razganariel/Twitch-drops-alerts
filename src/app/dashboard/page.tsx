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
  searchParams?: Promise<{ view?: string; filter?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const searchParams = await props.searchParams
  const overrideView = searchParams?.view
  const overrideFilter = searchParams?.filter

  const userId = session.user.id

  const [user, twitchConn, steamConn, activeDrops, totalAlerts, userGames] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { checkInterval: true, lastMatchAt: true, timezone: true, dashboardFilter: true, dashboardView: true },
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
      prisma.userGame.findMany({
        where: { userId },
        include: { game: true },
      }),
    ])

  if (!user) redirect("/login")

  const view = overrideView === "list" ? "list" : overrideView === "grid" ? "grid" : user.dashboardView === "LIST" ? "list" : "grid"
  const filter = overrideFilter === "all" ? "all" : overrideFilter === "match" ? "match" : user.dashboardFilter === "ALL" ? "all" : "match"

  const matchedNames = new Set(userGames.map((ug) => ug.game.name.toLowerCase().trim()))

  function isMatch(name: string) {
    return matchedNames.has(name.toLowerCase().trim())
  }

  let sorted = [...activeDrops]

  if (filter === "match") {
    sorted = sorted.filter((d) => isMatch(d.gameName))
    sorted.sort((a, b) => a.gameName.localeCompare(b.gameName))
  } else {
    sorted.sort((a, b) => {
      const aMatch = isMatch(a.gameName) ? 1 : 0
      const bMatch = isMatch(b.gameName) ? 1 : 0
      if (aMatch !== bMatch) return bMatch - aMatch
      return a.gameName.localeCompare(b.gameName)
    })
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
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
        syncedGames={userGames.length}
        steamLastSyncedAt={steamConn?.lastSyncedAt?.toISOString() ?? null}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <MatchSection
            hasSteam={!!steamConn}
            hasTwitch={!!twitchConn?.accessToken}
            alertCount={totalAlerts}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            <Button
              variant={filter === "match" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <Link href={`/dashboard?filter=match${view === "list" ? "&view=list" : ""}`}>
                Matchs
              </Link>
            </Button>
            <Button
              variant={filter === "all" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <Link href={`/dashboard?filter=all${view === "list" ? "&view=list" : ""}`}>
                Toutes
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-md border p-0.5">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              asChild
            >
              <Link href={`/dashboard?view=grid${filter === "all" ? "&filter=all" : ""}`} title="Vue grille">
                <LayoutGrid className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              asChild
            >
              <Link href={`/dashboard?view=list${filter === "all" ? "&filter=all" : ""}`} title="Vue liste">
                <List className="h-4 w-4" />
              </Link>
            </Button>
          </div>
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

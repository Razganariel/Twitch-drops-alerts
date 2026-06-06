import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MatchSection } from "./match-section"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [twitchConn, steamConn, alerts, alertCount] = await Promise.all([
    prisma.twitchConnection.findUnique({ where: { userId: session.user.id } }),
    prisma.steamConnection.findUnique({ where: { userId: session.user.id } }),
    prisma.alert.findMany({
      where: { userId: session.user.id },
      include: {
        game: true,
        drop: true,
      },
      orderBy: { sentAt: "desc" },
      take: 20,
    }),
    prisma.alert.count({ where: { userId: session.user.id } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue, {session.user.name ?? session.user.email}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connexions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {twitchConn && steamConn
              ? "Twitch et Steam connectés."
              : !twitchConn && !steamConn
                ? "Connecte tes comptes Twitch et Steam dans la section Connexions."
                : twitchConn
                  ? "Steam n'est pas encore connecté."
                  : "Twitch n'est pas encore connecté."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertes</CardTitle>
        </CardHeader>
        <CardContent>
          <MatchSection
            hasSteam={!!steamConn}
            hasTwitch={!!twitchConn}
            alertCount={alertCount}
          />
          {alerts.length > 0 && (
            <div className="mt-4 space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-md border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.game.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {a.drop.campaignName}
                      {a.drop.rewardName && ` — ${a.drop.rewardName}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(a.sentAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

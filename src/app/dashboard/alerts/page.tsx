import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { markAlertAsRead, markAllAlertsAsRead } from "@/lib/actions/alerts"

const STATUS_LABELS: Record<string, string> = {
  ALL: "Toutes",
  SENT: "Non lues",
  READ: "Lues",
}

const PER_PAGE = 25

export default async function AlertsPage(props: {
  searchParams?: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const searchParams = await props.searchParams
  const statusFilter = searchParams?.status ?? "ALL"
  const page = Math.max(1, Number(searchParams?.page ?? "1"))

  const where: Record<string, unknown> = { userId: session.user.id }
  if (statusFilter === "SENT") where.status = "SENT"
  else if (statusFilter === "READ") where.status = "READ"

  const [alerts, totalCount] = await Promise.all([
    prisma.alert.findMany({
      where,
      include: { game: true, drop: true },
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.alert.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / PER_PAGE)
  const hasUnread = statusFilter !== "READ"

  function buildUrl(status: string, p?: number) {
    const params = new URLSearchParams()
    if (status !== "ALL") params.set("status", status)
    if (p && p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/dashboard/alerts${qs ? `?${qs}` : ""}`
  }

  const statusLinks = ["ALL", "SENT", "READ"] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Alertes</h1>
        {hasUnread && (
          <form action={markAllAlertsAsRead}>
            <Button type="submit" variant="outline" size="sm">
              Tout marquer comme lu
            </Button>
          </form>
        )}
      </div>

      <div className="flex gap-2">
        {statusLinks.map((s) => {
          const active = statusFilter === s
          return (
            <Link
              key={s}
              href={buildUrl(s)}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {STATUS_LABELS[s]}
            </Link>
          )
        })}
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune alerte trouvée.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Jeu</th>
                <th className="px-4 py-3 text-left font-medium">Drop</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(alert.sentAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{alert.game.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">
                      {alert.drop.campaignName}
                    </span>
                    {alert.drop.rewardName && (
                      <span className="text-muted-foreground/60">
                        {" — "}{alert.drop.rewardName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {alert.status === "SENT" ? (
                      <Badge variant="secondary">Non lue</Badge>
                    ) : (
                      <Badge variant="outline">Lue</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {alert.status === "SENT" && (
                      <form action={markAlertAsRead.bind(null, alert.id)}>
                        <Button type="submit" variant="ghost" size="sm">
                          Marquer comme lue
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildUrl(statusFilter, page - 1)}
              className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80"
            >
              Précédent
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl(statusFilter, page + 1)}
              className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

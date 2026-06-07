import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { markAlertAsRead, markAllAlertsAsRead } from "@/lib/actions/alerts"

const STATUS_LABELS: Record<string, string> = {
  ALL: "Toutes",
  SENT: "Non lues",
  READ: "Lues",
}

const PER_PAGE = 25

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type AlertRow = {
  id: string
  sentAt: Date
  status: string
  game: { name: string }
  drop: { campaignName: string; rewardName: string | null; isActive: boolean }
}

function AlertTable({
  alerts,
  showActions,
}: {
  alerts: AlertRow[]
  showActions: boolean
}) {
  if (alerts.length === 0) return null

  return (
    <div className="rounded-md border">
      {/* Desktop table */}
      <table className="hidden md:table w-full text-sm">
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
                {formatDate(alert.sentAt)}
              </td>
              <td className={`px-4 py-3 font-medium ${!alert.drop.isActive ? "line-through text-muted-foreground" : ""}`}>
                {alert.game.name}
              </td>
              <td className={`px-4 py-3 ${!alert.drop.isActive ? "line-through text-muted-foreground" : ""}`}>
                <span>{alert.drop.campaignName}</span>
                {alert.drop.rewardName && (
                  <span className="text-muted-foreground/60">{" — "}{alert.drop.rewardName}</span>
                )}
              </td>
              <td className="px-4 py-3">
                {!alert.drop.isActive ? (
                  <Badge variant="secondary">Terminée</Badge>
                ) : alert.status === "SENT" ? (
                  <Badge variant="secondary">Non lue</Badge>
                ) : (
                  <Badge variant="outline">Lue</Badge>
                )}
              </td>
              <td className="px-4 py-3">
                {showActions && alert.drop.isActive && alert.status === "SENT" && (
                  <form action={markAlertAsRead.bind(null, alert.id)}>
                    <Button type="submit" variant="ghost" size="sm">Marquer comme lue</Button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="divide-y md:hidden">
        {alerts.map((alert) => (
          <div key={alert.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-sm font-medium ${!alert.drop.isActive ? "line-through text-muted-foreground" : ""}`}>
                  {alert.game.name}
                </p>
                <p className={`text-xs text-muted-foreground ${!alert.drop.isActive ? "line-through" : ""}`}>
                  {alert.drop.campaignName}
                  {alert.drop.rewardName && <> — {alert.drop.rewardName}</>}
                </p>
              </div>
              {!alert.drop.isActive ? (
                <Badge variant="secondary" className="shrink-0">Terminée</Badge>
              ) : alert.status === "SENT" ? (
                <Badge variant="secondary" className="shrink-0">Non lue</Badge>
              ) : (
                <Badge variant="outline" className="shrink-0">Lue</Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDate(alert.sentAt)}</span>
              {showActions && alert.drop.isActive && alert.status === "SENT" && (
                <form action={markAlertAsRead.bind(null, alert.id)}>
                  <Button type="submit" variant="ghost" size="sm" className="h-7 text-xs">Marquer comme lue</Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function AlertsPage(props: {
  searchParams?: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const searchParams = await props.searchParams
  const statusFilter = searchParams?.status ?? "ALL"
  const page = Math.max(1, Number(searchParams?.page ?? "1"))

  const whereBase: Prisma.AlertWhereInput = { userId: session.user.id }
  let statusWhere: Prisma.AlertWhereInput = {}
  if (statusFilter === "SENT") statusWhere = { status: "SENT" }
  else if (statusFilter === "READ") statusWhere = { status: "READ" }
  const where = { ...whereBase, ...statusWhere }

  const [activeAlerts, endedAlerts, activeCount, endedCount] = await Promise.all([
    prisma.alert.findMany({
      where: { ...where, drop: { isActive: true } },
      include: { game: true, drop: true },
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.alert.findMany({
      where: { ...where, drop: { isActive: false } },
      include: { game: true, drop: true },
      orderBy: { sentAt: "desc" },
    }),
    prisma.alert.count({ where: { ...where, drop: { isActive: true } } }),
    prisma.alert.count({ where: { ...where, drop: { isActive: false } } }),
  ])

  const totalPages = Math.ceil(activeCount / PER_PAGE)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Alertes</h1>
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

      {activeAlerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">En cours</h2>
          <AlertTable alerts={activeAlerts} showActions />
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
        </section>
      )}

      {endedAlerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Terminées
            <span className="ml-2 text-sm font-normal">({endedCount})</span>
          </h2>
          <AlertTable alerts={endedAlerts} showActions={false} />
        </section>
      )}

      {activeAlerts.length === 0 && endedAlerts.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune alerte trouvée.</p>
      )}
    </div>
  )
}

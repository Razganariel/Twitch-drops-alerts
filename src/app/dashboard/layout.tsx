import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { LogoutButton } from "./logout-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const unreadCount = await prisma.alert.count({
    where: { userId: session.user.id, status: "SENT" },
  })

  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="flex w-64 flex-col border-r bg-background p-4">
        <Link href="/dashboard" className="mb-8 text-lg font-semibold shrink-0">
          Twitch Drops
        </Link>
        <nav className="flex flex-col gap-2 overflow-y-auto">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/library"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Bibliothèque
          </Link>
          <Link
            href="/dashboard/alerts"
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <span>Alertes</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {unreadCount}
              </Badge>
            )}
          </Link>
          <Link
            href="/dashboard/settings"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Paramètres
          </Link>
        </nav>
        <div className="mt-auto pt-4 border-t shrink-0">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-y-auto p-8">{children}</main>
    </div>
  )
}

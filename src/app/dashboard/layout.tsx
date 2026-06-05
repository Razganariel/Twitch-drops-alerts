import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-64 flex-col border-r bg-background p-4">
        <Link href="/dashboard" className="mb-8 text-lg font-semibold">
          Twitch Drops
        </Link>
        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/connections"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Connexions
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}

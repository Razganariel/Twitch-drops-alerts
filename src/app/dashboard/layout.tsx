import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardSidebar } from "./dashboard-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [unreadCount, user] = await Promise.all([
    prisma.alert.count({
      where: { userId: session.user.id, status: "SENT" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    }),
  ])

  return (
    <div className="flex h-svh overflow-hidden">
      <DashboardSidebar unreadCount={unreadCount} isAdmin={user?.isAdmin ?? false} />
      <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}

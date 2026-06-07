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

  const unreadCount = await prisma.alert.count({
    where: { userId: session.user.id, status: "SENT" },
  })

  return (
    <div className="flex h-svh overflow-hidden">
      <DashboardSidebar unreadCount={unreadCount} />
      <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}

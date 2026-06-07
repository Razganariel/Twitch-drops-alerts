import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getSteamLogoUrl } from "@/services/steam"
import { LibraryClient } from "./client"

export default async function LibraryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userGames = await prisma.userGame.findMany({
    where: { userId: session.user.id },
    include: { game: true },
    orderBy: { game: { name: "asc" } },
  })

  const games = userGames.map((ug) => ({
    id: ug.game.id,
    steamAppId: ug.game.steamAppId,
    name: ug.game.name,
    logoUrl: ug.game.logoUrl ?? getSteamLogoUrl(ug.game.steamAppId),
    isAlertEnabled: ug.isAlertEnabled,
    deletedAt: ug.deletedAt?.toISOString() ?? null,
  }))

  return <LibraryClient games={games} />
}

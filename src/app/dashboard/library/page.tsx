import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { safeDecrypt } from "@/lib/encryption"
import { getSteamLogoUrl } from "@/services/steam"
import { LibraryClient } from "./client"

export default async function LibraryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userGames = await prisma.userGame.findMany({
    where: { userId: session.user.id },
    include: { game: true },
  })

  const games = userGames
    .map((ug) => ({
      id: ug.game.id,
      steamAppId: ug.game.steamAppId,
      name: safeDecrypt(ug.game.name),
      logoUrl: ug.game.logoUrl ?? getSteamLogoUrl(ug.game.steamAppId),
      isAlertEnabled: ug.isAlertEnabled,
      deletedAt: ug.deletedAt?.toISOString() ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return <LibraryClient games={games} />
}

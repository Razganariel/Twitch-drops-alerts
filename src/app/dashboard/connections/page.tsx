import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TwitchConnectionCard } from "./twitch-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ConnectionsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const twitchConnection = await prisma.twitchConnection.findUnique({
    where: { userId: session.user.id },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Connexions</h1>
      <p className="text-muted-foreground">
        Gérez vos connexions aux plateformes de jeux.
      </p>
      <TwitchConnectionCard connection={twitchConnection} />
      <Card>
        <CardHeader>
          <CardTitle>Steam</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La connexion Steam sera disponible prochainement.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

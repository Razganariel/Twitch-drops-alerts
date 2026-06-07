import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { checkInterval: true, lastMatchAt: true },
  })

  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle>Synchronisation automatique</CardTitle>
          <CardDescription>
            Fréquence à laquelle le système vérifie les nouveaux drops et les
            compare à ta bibliothèque Steam. Dernière vérification :{" "}
            {user.lastMatchAt
              ? new Date(user.lastMatchAt).toLocaleString("fr-FR")
              : "jamais"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm currentInterval={user.checkInterval} />
        </CardContent>
      </Card>
    </div>
  )
}

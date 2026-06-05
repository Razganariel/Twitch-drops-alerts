import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Bienvenue, {session.user.name ?? session.user.email}
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Connexions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connectez vos comptes Twitch et Steam pour commencer à recevoir des
            alertes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

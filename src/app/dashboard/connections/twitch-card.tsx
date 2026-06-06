"use client"

import { useActionState } from "react"
import { signIn } from "next-auth/react"
import { syncFollowedGames } from "@/lib/actions/twitch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Props = {
  connection: {
    twitchLogin: string | null
    hasAccessToken: boolean
    followedGamesCount: number
  } | null
}

export function TwitchConnectionCard({ connection }: Props) {
  const [syncResult, syncAction, syncPending] = useActionState(syncFollowedGames, null)
  const isConnected = !!connection?.hasAccessToken

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Twitch</CardTitle>
            <CardDescription>
              {isConnected
                ? `Connecté en tant que ${connection!.twitchLogin}`
                : "Non connecté"}
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="default">Connecté</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant={isConnected ? "outline" : "default"}
          className="w-full"
          onClick={() => signIn("twitch", { redirectTo: "/dashboard/connections" })}
        >
          {isConnected ? "Reconnecter Twitch" : "Connecter Twitch"}
        </Button>

        {isConnected && (
          <div className="pt-2 border-t space-y-2">
            {connection!.followedGamesCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {connection!.followedGamesCount} jeu{connection!.followedGamesCount > 1 ? "x" : ""} suivis sur Twitch
              </p>
            )}
            <form action={syncAction}>
              <Button variant="secondary" className="w-full" disabled={syncPending}>
                {syncPending
                  ? "Synchronisation..."
                  : "Synchroniser mes jeux suivis"}
              </Button>
            </form>
            {syncResult && (
              <p className={`text-sm ${syncResult.ok ? "text-emerald-600" : "text-destructive"}`}>
                {syncResult.message}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useActionState } from "react"
import { saveTwitchCredentials, syncFollowedGames } from "@/lib/actions/twitch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Props = {
  connection: {
    clientId: string
    twitchLogin: string | null
    expiresAt: Date | null
    hasAccessToken: boolean
    followedGamesCount: number
  } | null
}

export function TwitchConnectionCard({ connection }: Props) {
  const [credResult, credAction, credPending] = useActionState(saveTwitchCredentials, null)
  const [syncResult, syncAction, syncPending] = useActionState(syncFollowedGames, null)
  const isConnected = !!(connection?.twitchLogin)
  const canSync = !!connection?.hasAccessToken

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Twitch</CardTitle>
            <CardDescription>
              {isConnected
                ? `Connecté en tant que ${connection.twitchLogin}`
                : connection?.clientId
                  ? "Prêt à connecter"
                  : "Non configuré"}
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="default">Connecté</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={credAction} className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="clientId">Client ID Twitch</Label>
            <Input
              id="clientId"
              name="clientId"
              defaultValue={connection?.clientId ?? ""}
              placeholder="Ton Client ID Twitch"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="clientSecret">Client Secret Twitch</Label>
            <Input
              id="clientSecret"
              name="clientSecret"
              type="password"
              placeholder="Ton Client Secret Twitch"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={credPending}>
            {credPending ? "Enregistrement..." : "Enregistrer les identifiants"}
          </Button>
          {credResult && (
            <p className={`text-sm ${credResult.ok ? "text-emerald-600" : "text-destructive"}`}>
              {credResult.message}
            </p>
          )}
        </form>

        {connection?.clientId && (
          <div className="pt-2 border-t">
            <Button variant="outline" className="w-full" asChild>
              <a href="/api/connections/twitch/auth">
                {isConnected ? "Reconnecter Twitch" : "Connecter Twitch"}
              </a>
            </Button>
          </div>
        )}

        {isConnected && connection?.expiresAt && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connecté en tant que</span>
              <span>{connection.twitchLogin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token expire le</span>
              <span>{new Date(connection.expiresAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {canSync && (
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

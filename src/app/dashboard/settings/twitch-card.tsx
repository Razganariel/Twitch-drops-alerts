"use client"

import { useActionState } from "react"
import { signIn } from "next-auth/react"
import { syncFollowedGames } from "@/lib/actions/twitch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCooldown } from "@/components/shared/use-cooldown"

type Props = {
  syncCooldownMs: number
  connection: {
    twitchLogin: string | null
    hasAccessToken: boolean
    followedGamesCount: number
    activeDropsCount: number
  } | null
}

export function TwitchConnectionCard({ syncCooldownMs, connection }: Props) {
  const isConnected = !!connection?.hasAccessToken

  const [fResult, fAction, fPending] = useActionState(syncFollowedGames, null)
  const followedCooldown = useCooldown("sync:twitch:followed", syncCooldownMs)

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
          {isConnected && <Badge variant="default">Connecté</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant={isConnected ? "outline" : "default"}
          className="w-full"
          onClick={() => signIn("twitch", { redirectTo: "/dashboard/settings" })}
        >
          {isConnected ? "Reconnecter Twitch" : "Connecter Twitch"}
        </Button>

        {isConnected && (
          <div className="space-y-3 pt-2 border-t">
            <div>
              {connection!.followedGamesCount > 0 && (
                <p className="text-sm text-muted-foreground mb-2">
                  {connection!.followedGamesCount} jeu
                  {connection!.followedGamesCount > 1 ? "x" : ""} suivis sur Twitch
                </p>
              )}
              <form action={() => { followedCooldown.markSynced(); fAction() }}>
                <Button variant="secondary" className="w-full" disabled={fPending || followedCooldown.isOnCooldown}>
                  {fPending
                    ? "Synchronisation..."
                    : "Synchroniser mes jeux suivis"}
                  {followedCooldown.isOnCooldown && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {followedCooldown.remaining >= 60000
                        ? `${Math.ceil(followedCooldown.remaining / 60000)} min`
                        : `${Math.ceil(followedCooldown.remaining / 1000)}s`}
                    </span>
                  )}
                </Button>
              </form>
              {fResult && (
                <p className={`mt-1 text-sm ${fResult.ok ? "text-emerald-600" : "text-destructive"}`}>
                  {fResult.message}
                </p>
              )}
            </div>

            {connection!.activeDropsCount > 0 && (
              <p className="text-sm text-muted-foreground mb-2">
                {connection!.activeDropsCount} campagne
                {connection!.activeDropsCount > 1 ? "s" : ""} de drops active
                {connection!.activeDropsCount > 1 ? "s" : ""} en base
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
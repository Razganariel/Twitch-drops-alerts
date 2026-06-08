"use client"

import { useActionState } from "react"
import type { ConnectSteamResult } from "@/lib/actions/steam"
import { connectSteam } from "@/lib/actions/steam"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCooldown } from "@/components/shared/use-cooldown"

type SteamConnectionData = {
  steamId: string
  lastSyncedAt: Date | null
  gameCount: number
} | null

export function SteamConnectionCard({
  connection,
}: {
  connection: SteamConnectionData
}) {
  const [result, formAction, isPending] = useActionState(
    async (_prev: ConnectSteamResult | null, formData: FormData) =>
      connectSteam(_prev, formData),
    null,
  )
  const cooldown = useCooldown("sync:steam")

  const isConnected = !!(connection || result?.steamId)
  const displaySteamId = result?.steamId || connection?.steamId || ""
  const displayGameCount = result?.gameCount ?? connection?.gameCount ?? 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Steam</CardTitle>
            <CardDescription>
              {isConnected
                ? `Connecté - ${displayGameCount} jeux importés`
                : "Non connecté"}
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="default">Connecté</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form action={(formData) => { cooldown.markSynced(); formAction(formData) }} className="space-y-4">
          {isConnected ? (
            <div className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Steam ID</span>
                  <span className="font-mono">{displaySteamId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clé API</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Clé valide</span>
                </div>
                {connection?.lastSyncedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dernière synchro</span>
                    <span>{new Date(connection.lastSyncedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isPending || cooldown.isOnCooldown}>
                {isPending
                  ? "Synchronisation..."
                  : "Synchroniser ma bibliothèque"}
                {cooldown.isOnCooldown && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({Math.ceil(cooldown.remaining / 60000)} min)
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="username">Pseudo Steam ou ID Steam</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Pseudo (dans /id/...) ou ID numérique à 17 chiffres"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apiKey">Clé API Steam</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  placeholder="Votre clé API Steam"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending || cooldown.isOnCooldown}>
                {isPending
                  ? "Connexion..."
                  : "Connecter mon compte Steam"}
                {cooldown.isOnCooldown && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({Math.ceil(cooldown.remaining / 60000)} min)
                  </span>
                )}
              </Button>
            </>
          )}
        </form>
        {result && !result.ok && (
          <p className="mt-3 text-sm text-destructive">{result.message}</p>
        )}
        {result?.ok && result.message && (
          <p className="mt-3 text-sm text-emerald-600">{result.message}</p>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useActionState } from "react"
import { connectSteam } from "@/lib/actions/steam"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const COOLDOWN_MS = 5 * 60 * 1000

function useCooldown(key: string) {
  const [remaining, setRemaining] = useState(() => {
    if (typeof window === "undefined") return 0
    const lastSync = Number(localStorage.getItem(key) || "0")
    return lastSync ? Math.max(0, COOLDOWN_MS - (Date.now() - lastSync)) : 0
  })

  const markSynced = () => {
    const now = Date.now()
    localStorage.setItem(key, String(now))
    setRemaining(COOLDOWN_MS)
  }

  return { isOnCooldown: remaining > 0, remaining, markSynced }
}

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
  const [result, formAction, isPending] = useActionState(connectSteam, null)
  const cooldown = useCooldown("sync:steam")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Steam</CardTitle>
            <CardDescription>
              {connection
                ? `Connecté - ${connection.gameCount} jeux importés`
                : "Non connecté"}
            </CardDescription>
          </div>
          {connection && (
            <Badge variant="default">Connecté</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {connection ? (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Steam ID</span>
                <span>{connection.steamId}</span>
              </div>
              {connection.lastSyncedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernière synchro</span>
                  <span>{new Date(connection.lastSyncedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <form action={(formData) => { cooldown.markSynced(); formAction(formData) }} className="space-y-3">
              <input type="hidden" name="steamId" value={connection.steamId} />
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
                  ? "Synchronisation..."
                  : "Synchroniser ma bibliothèque"}
                {cooldown.isOnCooldown && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({Math.ceil(cooldown.remaining / 60000)} min)
                  </span>
                )}
              </Button>
            </form>
          </div>
        ) : (
          <form action={(formData) => { cooldown.markSynced(); formAction(formData) }} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={isPending || cooldown.isOnCooldown}>
              {isPending
                ? "Connexion..."
                : "Synchroniser ma bibliothèque"}
              {cooldown.isOnCooldown && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({Math.ceil(cooldown.remaining / 60000)} min)
                </span>
              )}
            </Button>
          </form>
        )}
        {result && !result.ok && (
          <p className="mt-3 text-sm text-destructive">{result.message}</p>
        )}
        {result?.ok && (
          <p className="mt-3 text-sm text-emerald-600">
            {result.gameCount} jeux importés
          </p>
        )}
      </CardContent>
    </Card>
  )
}

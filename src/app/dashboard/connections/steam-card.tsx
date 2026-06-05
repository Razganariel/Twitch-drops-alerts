"use client"

import { useActionState } from "react"
import { connectSteam } from "@/lib/actions/steam"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
            <form action={formAction} className="space-y-3">
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
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Synchronisation..." : "Synchroniser ma bibliothèque"}
              </Button>
            </form>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
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
              <Label htmlFor="username">Pseudo Steam (optionnel)</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Votre pseudo Steam"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Connexion..." : "Synchroniser ma bibliothèque"}
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

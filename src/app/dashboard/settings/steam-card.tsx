"use client"

import { useActionState, useState } from "react"
import type { ConnectSteamResult } from "@/lib/actions/steam"
import { connectSteam } from "@/lib/actions/steam"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCooldown } from "@/components/shared/use-cooldown"
import { steamSchema } from "@/lib/schemas/steam"

type SteamConnectionData = {
  steamId: string
  lastSyncedAt: Date | null
  gameCount: number
} | null

export function SteamConnectionCard({
  timezone,
  connection,
}: {
  timezone: string
  connection: SteamConnectionData
}) {
  const [result, formAction, isPending] = useActionState(
    async (_prev: ConnectSteamResult | null, formData: FormData) => {
      const parsed = steamSchema.safeParse({
        steamId: formData.get("steamId") ?? "",
        username: formData.get("username") ?? "",
        apiKey: formData.get("apiKey") ?? "",
      })
      if (!parsed.success) {
        const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
        return { ok: false, message: firstError ?? "Données invalides" }
      }
      return connectSteam(_prev, formData)
    },
    null,
  )
  const cooldown = useCooldown("sync:steam")

  const isConnected = !!(connection || result?.steamId)
  const showConnected = isConnected && !result?.needsReauth
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
          {showConnected ? (
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
                    <span>{new Date(connection.lastSyncedAt).toLocaleString("fr-FR", { timeZone: timezone, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
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
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                L&apos;API Steam ne fonctionne que si ta bibliothèque est publique et ne permet pas de distinguer les jeux masqués ou privés. Le nom des jeux est donc chiffré en base de données.
              </p>
            </div>
          ) : (
            <>
              {result?.needsReauth && (
                <p className="text-sm text-destructive">
                  Ta clé API Steam n&apos;est plus valide. Saissis-en une nouvelle pour continuer.
                </p>
              )}
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

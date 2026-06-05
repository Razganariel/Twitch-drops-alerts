"use client"

import { useActionState } from "react"
import { saveTwitchCredentials } from "@/lib/actions/twitch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type TwitchConnectionData = {
  clientId: string
  twitchLogin: string | null
  expiresAt: Date | null
} | null

export function TwitchConnectionCard({
  connection,
}: {
  connection: TwitchConnectionData
}) {
  const [result, formAction, isPending] = useActionState(saveTwitchCredentials, null)
  const isConnected = !!(connection?.twitchLogin)

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
        <form action={formAction} className="space-y-3">
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
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Enregistrer les identifiants"}
          </Button>
          {result && (
            <p className={`text-sm ${result.ok ? "text-emerald-600" : "text-destructive"}`}>
              {result.message}
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
      </CardContent>
    </Card>
  )
}

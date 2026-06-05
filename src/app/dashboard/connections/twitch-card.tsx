import type { TwitchConnection } from "@/generated/prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function isTokenExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now()
}

export function TwitchConnectionCard({
  connection,
}: {
  connection: TwitchConnection | null
}) {
  const expired = connection ? isTokenExpired(connection.expiresAt) : false

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Twitch</CardTitle>
            <CardDescription>
              {connection
                ? `Connecté en tant que ${connection.twitchLogin}`
                : "Non connecté"}
            </CardDescription>
          </div>
          {connection && (
            <Badge variant={expired ? "destructive" : "default"}>
              {expired ? "Token expiré" : "Connecté"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {connection ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Twitch</span>
              <span>{connection.twitchId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token expire le</span>
              <span>{connection.expiresAt.toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connectez votre compte Twitch pour recevoir des alertes de drops.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

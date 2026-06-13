"use client"

import { useState, useEffect, useCallback, useRef, useActionState, startTransition } from "react"
import { signIn } from "next-auth/react"
import { syncFollowedGames, syncActiveDrops, startGqlDeviceFlow, checkGqlDeviceFlow } from "@/lib/actions/twitch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCooldown } from "@/components/shared/use-cooldown"

type Props = {
  connection: {
    twitchLogin: string | null
    hasAccessToken: boolean
    followedGamesCount: number
    activeDropsCount: number
  } | null
}

export function TwitchConnectionCard({ connection }: Props) {
  const isConnected = !!connection?.hasAccessToken

  const [fResult, fAction, fPending] = useActionState(syncFollowedGames, null)
  const [dResult, dAction, dPending] = useActionState(syncActiveDrops, null)
  const followedCooldown = useCooldown("sync:twitch:followed")
  const dropsCooldown = useCooldown("sync:twitch:drops")

  const [autoSync, setAutoSync] = useState(false)

  const [gql, setGql] = useState<{
    step: "idle" | "code" | "polling" | "done" | "error"
    userCode?: string
    verificationUri?: string
    message?: string
  }>({ step: "idle" })

  const needsGqlAuth = dResult && "needsGqlAuth" in dResult && dResult.needsGqlAuth

  const handleGqlAuth = useCallback(async () => {
    const flow = await startGqlDeviceFlow()
    if (!flow.ok || !flow.deviceCode) {
      setGql({ step: "error", message: flow.message ?? "Erreur" })
      return
    }

    setGql({
      step: "polling",
      userCode: flow.userCode,
      verificationUri: flow.verificationUri,
    })

    const poll = async () => {
      const r = await checkGqlDeviceFlow(flow.deviceCode!)

      if (r.pending) {
        setTimeout(poll, (flow.interval ?? 5) * 1000)
        return
      }

      setGql({
        step: r.ok ? "done" : "error",
        message: r.ok ? "Autorisation réussie ! Synchronisation en cours..." : r.message,
      })
    }

    setTimeout(poll, (flow.interval ?? 5) * 1000)
  }, [])

  const dropsFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (gql.step === "done") {
      setAutoSync(true)
      const formData = new FormData()
      formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone)
      startTransition(() => {
        dAction(formData)
      })
    }
  }, [gql.step, dAction])

  useEffect(() => {
    if (dResult) {
      setAutoSync(false)
    }
  }, [dResult])

  useEffect(() => {
    if (dResult && dResult.ok && !("needsGqlAuth" in dResult)) {
      dropsCooldown.markSynced()
    }
  }, [dResult, dropsCooldown])

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
                      ({Math.ceil(followedCooldown.remaining / 60000)} min)
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

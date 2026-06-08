"use client"

import { useState, useEffect, useCallback, useRef, useActionState } from "react"
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
      dAction(formData)
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

            <div>
              {connection!.activeDropsCount > 0 && (
                <p className="text-sm text-muted-foreground mb-2">
                  {connection!.activeDropsCount} campagne
                  {connection!.activeDropsCount > 1 ? "s" : ""} de drops active
                  {connection!.activeDropsCount > 1 ? "s" : ""} en base
                </p>
              )}

              {needsGqlAuth && gql.step === "idle" ? (
                <Button variant="secondary" className="w-full" onClick={handleGqlAuth}>
                  Autoriser l&apos;accès aux drops
                </Button>
              ) : gql.step === "polling" ? (
                <div className="space-y-3 rounded-md border p-4 text-center">
                  <p className="text-sm font-medium">Autorise l&apos;accès aux drops Twitch</p>
                  <ol className="text-left text-sm space-y-2">
                    <li>
                      1. Va sur{" "}
                      <a
                        href={gql.verificationUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-primary"
                      >
                        {gql.verificationUri}
                      </a>
                    </li>
                    <li>2. Connecte-toi si nécessaire</li>
                    <li>
                      3. Entre le code :{" "}
                      <span className="font-mono font-bold text-lg tracking-widest">
                        {gql.userCode}
                      </span>
                    </li>
                  </ol>
                  <p className="text-sm text-muted-foreground animate-pulse">
                    En attente d&apos;autorisation...
                  </p>
                </div>
              ) : (
                <form ref={dropsFormRef} action={(formData) => dAction(formData)}>
                  <input type="hidden" name="timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />
                  <Button variant="secondary" className="w-full" disabled={dPending || dropsCooldown.isOnCooldown || autoSync}>
                    {autoSync
                      ? "Synchronisation en cours..."
                      : dPending
                        ? "Récupération..."
                        : dropsCooldown.isOnCooldown
                          ? `Synchroniser les drops actifs (${Math.ceil(dropsCooldown.remaining / 60000)} min)`
                          : "Synchroniser les drops actifs"}
                  </Button>
                </form>
              )}

              {gql.step === "error" && (
                <p className="text-sm text-destructive">{gql.message}</p>
              )}

              {dResult && !("needsGqlAuth" in dResult) && (
                <p className={`mt-1 text-sm ${dResult.ok ? "text-emerald-600" : "text-destructive"}`}>
                  {dResult.message}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

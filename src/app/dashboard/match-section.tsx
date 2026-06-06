"use client"

import { useActionState } from "react"
import { matchDrops } from "@/lib/actions/matching"
import { Button } from "@/components/ui/button"

type Props = {
  hasSteam: boolean
  hasTwitch: boolean
  alertCount: number
}

export function MatchSection({ hasSteam, hasTwitch, alertCount }: Props) {
  const [result, action, isPending] = useActionState(matchDrops, null)

  if (!hasTwitch || !hasSteam) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {alertCount > 0
            ? `${alertCount} alerte${alertCount > 1 ? "s" : ""}`
            : "Aucune alerte pour le moment"}
        </p>
        <form action={action}>
          <Button variant="secondary" size="sm" disabled={isPending}>
            {isPending ? "Analyse..." : "Lancer le matching"}
          </Button>
        </form>
      </div>
      {result && (
        <p className={`text-sm ${result.ok ? "text-emerald-600" : "text-destructive"}`}>
          {result.message}
        </p>
      )}
    </div>
  )
}

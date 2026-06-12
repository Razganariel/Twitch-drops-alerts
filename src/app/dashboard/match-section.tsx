"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { matchDrops } from "@/lib/actions/matching"
import { Button } from "@/components/ui/button"

type Props = {
  hasSteam: boolean
  hasTwitch: boolean
  alertCount: number
}

export function MatchSection({ hasSteam, hasTwitch, alertCount }: Props) {
  const router = useRouter()
  const [isPending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setError] = useState(false)

  if (!hasTwitch || !hasSteam) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {alertCount > 0
            ? `${alertCount} alerte${alertCount > 1 ? "s" : ""}`
            : "Aucune alerte pour le moment"}
        </p>
        <form action={async () => {
          setPending(true)
          setMessage(null)
          const result = await matchDrops()
          router.refresh()
          setMessage(result.message)
          setError(!result.ok)
          setPending(false)
        }}>
          <Button variant="secondary" size="sm" disabled={isPending}>
            {isPending ? "Analyse..." : "Lancer le matching"}
          </Button>
        </form>
      </div>
      {message && (
        <p className={`text-sm ${isError ? "text-destructive" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
    </div>
  )
}

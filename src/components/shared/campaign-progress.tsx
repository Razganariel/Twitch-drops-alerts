"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"

export function CampaignProgress({
  startAt,
  endAt,
  variant = "row",
}: {
  startAt: string
  endAt: string
  variant?: "card" | "row"
}) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const compute = () => {
      const now = Date.now()
      const start = new Date(startAt).getTime()
      const end = new Date(endAt).getTime()
      const total = end - start
      const elapsed = now - start
      setPct(total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0)
    }
    compute()
    const id = setInterval(compute, 60000)
    return () => clearInterval(id)
  }, [startAt, endAt])

  if (variant === "card") {
    return (
      <div className="space-y-1">
        <Progress value={pct} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          {Math.round(pct)}% — fin le {new Date(endAt).toLocaleDateString("fr-FR")}
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="h-1.5 w-24 max-sm:hidden" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{Math.round(pct)}%</span>
    </div>
  )
}

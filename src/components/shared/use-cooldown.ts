"use client"

import { useState } from "react"

const COOLDOWN_MS = 5 * 60 * 1000

export function useCooldown(key: string) {
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

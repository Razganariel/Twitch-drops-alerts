"use client"

import { useState } from "react"

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000

export function useCooldown(key: string, cooldownMs: number = DEFAULT_COOLDOWN_MS) {
  const [remaining, setRemaining] = useState(() => {
    if (typeof window === "undefined") return 0
    const lastSync = Number(localStorage.getItem(key) || "0")
    return lastSync ? Math.max(0, cooldownMs - (Date.now() - lastSync)) : 0
  })

  const markSynced = () => {
    const now = Date.now()
    localStorage.setItem(key, String(now))
    setRemaining(cooldownMs)
  }

  return { isOnCooldown: remaining > 0, remaining, markSynced }
}

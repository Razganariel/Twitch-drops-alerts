"use client"

import { useEffect, useRef } from "react"
import { updateTimezone } from "@/lib/actions/settings"

export function TimezoneDetector({ currentTimezone }: { currentTimezone: string | null }) {
  const saved = useRef(false)

  useEffect(() => {
    if (saved.current) return
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detected && detected !== currentTimezone) {
      saved.current = true
      const formData = new FormData()
      formData.set("timezone", detected)
      updateTimezone(formData)
    }
  }, [currentTimezone])

  return null
}

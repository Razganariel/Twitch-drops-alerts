"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"

const modes = [
  { value: "light", icon: Sun, label: "Clair" },
  { value: "dark", icon: Moon, label: "Sombre" },
  { value: "system", icon: Monitor, label: "Système" },
] as const

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const current = theme === "system" ? "system" : (theme ?? "system")
  const currentIndex = modes.findIndex((m) => m.value === current)
  const next = modes[(currentIndex + 1) % modes.length]

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5" disabled>
        <Sun className="h-4 w-4" />
        <Moon className="h-4 w-4" />
        <Monitor className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 gap-1.5"
      onClick={() => setTheme(next.value)}
      title={`Thème : ${modes.find((m) => m.value === current)?.label} → ${next.label}`}
    >
      {modes.map((m) => {
        const Icon = m.icon
        return (
          <Icon
            key={m.value}
            className={`h-4 w-4 ${m.value === current ? "text-foreground" : "text-muted-foreground"}`}
          />
        )
      })}
    </Button>
  )
}

"use client"

import { useState } from "react"
import { updateTimezone } from "@/lib/actions/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const COMMON_ZONES = [
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
]

export function TimezoneSelector({ currentTimezone }: { currentTimezone: string | null }) {
  const [selected, setSelected] = useState(currentTimezone ?? "UTC")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    const formData = new FormData()
    formData.set("timezone", selected)
    const result = await updateTimezone(formData)
    setMessage(result.ok ? "Fuseau mis à jour" : result.message)
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuseau horaire</CardTitle>
        <CardDescription>
          Les dates seront affichées dans ce fuseau. Actuellement : {currentTimezone ?? "UTC"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {COMMON_ZONES.map((tz) => (
            <Label
              key={tz}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                selected === tz
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="timezone"
                value={tz}
                checked={selected === tz}
                onChange={(e) => setSelected(e.target.value)}
                className="sr-only"
              />
              {tz.replace("_", " ")}
            </Label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving || selected === currentTimezone}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
          {message && (
            <span className={`text-sm ${message === "Fuseau mis à jour" ? "text-emerald-600" : "text-destructive"}`}>
              {message}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { updateTimezone } from "@/lib/actions/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const ALL_ZONES = Intl.supportedValuesOf("timeZone").sort()

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
        <div className="space-y-1.5">
          <Label htmlFor="timezone-select">Fuseau</Label>
          <select
            id="timezone-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {ALL_ZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
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

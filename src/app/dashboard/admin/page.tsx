"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Power, PowerOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSettings, saveSetting, testSetting, toggleMaintenance } from "@/lib/actions/admin"
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react"

type SettingEntry = {
  key: string
  value: string
  updatedAt: Date | null
}

type TestResult = {
  ok: boolean
  message: string
}

const SETTING_META: Record<string, { label: string; secret: boolean }> = {
  maintenance: { label: "Mode maintenance", secret: false },
  TWITCH_CLIENT_ID: { label: "Client ID Twitch", secret: false },
  TWITCH_CLIENT_SECRET: { label: "Client Secret Twitch", secret: true },
  RESEND_API_KEY: { label: "Clé API Resend", secret: true },
  SMTP_HOST: { label: "Serveur SMTP", secret: false },
  SMTP_PORT: { label: "Port SMTP", secret: false },
  SMTP_USER: { label: "Utilisateur SMTP", secret: false },
  SMTP_PASS: { label: "Mot de passe SMTP", secret: true },
}

const ENV_SETTINGS = [
  { key: "DATABASE_URL", label: "URL de la base de données" },
  { key: "REDIS_URL", label: "URL Redis" },
]

function maskEnv(value: string) {
  try {
    const url = new URL(value)
    if (url.password) url.password = "******"
    if (url.username) url.username = "******"
    return url.toString()
  } catch {
    if (value.length > 8) return value.slice(0, 4) + "******" + value.slice(-4)
    return "******"
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SettingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ key: string; result: TestResult } | null>(null)
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set())
  const [maintenanceActive, setMaintenanceActive] = useState(false)
  const [togglingMaintenance, setTogglingMaintenance] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings()
      setSettings(data)
      const maint = data.find((s) => s.key === "maintenance")
      setMaintenanceActive(maint?.value === "true")
    } catch {
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  function getValue(key: string) {
    return settings.find((s) => s.key === key)?.value ?? ""
  }

  function isConfigured(key: string) {
    const v = getValue(key)
    return v.length > 0
  }

  async function handleSave(key: string) {
    setSaving(key)
    try {
      await saveSetting(key, editValue)
      setEditing(null)
      await loadSettings()
    } catch {}
    setSaving(null)
  }

  async function handleTest(key: string) {
    setTesting(key)
    setTestResult(null)
    try {
      const result = await testSetting(key)
      setTestResult({ key, result })
    } catch {}
    setTesting(null)
  }

  async function handleToggleMaintenance() {
    setTogglingMaintenance(true)
    try {
      const result = await toggleMaintenance()
      setMaintenanceActive(result.active)
      setTestResult(null)
    } catch {}
    setTogglingMaintenance(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground mt-1">Gestion des paramètres de l&apos;application</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mode maintenance</CardTitle>
          <CardDescription>Activer ou désactiver le mode maintenance de l&apos;application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant={maintenanceActive ? "destructive" : "outline"}
              size="sm"
              onClick={handleToggleMaintenance}
              disabled={togglingMaintenance}
              className="gap-2"
            >
              {togglingMaintenance ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : maintenanceActive ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {maintenanceActive ? "Désactiver" : "Activer"}
            </Button>
            <span className="text-sm">
              {maintenanceActive ? (
                <Badge variant="destructive">Maintenance active</Badge>
              ) : (
                <Badge variant="secondary">Maintenance inactive</Badge>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres dynamiques</CardTitle>
          <CardDescription>Ces paramètres sont stockés en base de données et chiffrés au repos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(SETTING_META).map(([key, meta]) => {
            if (key === "maintenance") return null
            const configured = isConfigured(key)
            const isSecret = meta.secret
            const showValue = !isSecret || showSecrets.has(key)

            return (
              <div key={key} className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium">{meta.label}</Label>
                  {editing === key ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        type={isSecret && !showValue ? "password" : "text"}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={() => setShowSecrets((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n })}>
                        {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" onClick={() => handleSave(key)} disabled={saving === key}>
                        {saving === key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {configured ? (showValue ? getValue(key) : "••••••••") : "Non configuré"}
                      </span>
                      {isSecret && configured && (
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowSecrets((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n })}>
                          {showValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {configured ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">Configuré</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Non configuré</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditing(key); setEditValue(getValue(key)) }}
                  >
                    Modifier
                  </Button>
                  {key !== "maintenance" && key !== "SMTP_PASS" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleTest(key)}
                      disabled={testing === key || !configured}
                    >
                      {testing === key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tester"}
                    </Button>
                  )}
                  {key === "SMTP_HOST" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleTest("SMTP")}
                      disabled={testing === "SMTP" || !isConfigured("SMTP_HOST") || !isConfigured("SMTP_USER")}
                    >
                      {testing === "SMTP" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tester"}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat du test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {testResult.result.ok ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm">{testResult.result.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Paramètres d&apos;environnement</CardTitle>
          <CardDescription>Ces paramètres sont lus depuis le fichier .env (lecture seule)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ENV_SETTINGS.map(({ key, label }) => {
            const value = process.env[key] ?? ""
            return (
              <div key={key} className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-sm text-muted-foreground truncate font-mono mt-1">
                    {value ? maskEnv(value) : "Non défini"}
                  </p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

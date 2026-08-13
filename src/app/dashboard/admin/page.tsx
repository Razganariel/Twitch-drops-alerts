"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Power, PowerOff, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSettings, saveSetting, testSetting, toggleMaintenance, getEnvSettings } from "@/lib/actions/admin"
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
  const [smtpEditing, setSmtpEditing] = useState(false)
  const [envSettings, setEnvSettings] = useState<{ key: string; label: string; value: string }[]>([])
  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState("")
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpPass, setSmtpPass] = useState("")
  const [savingSmtp, setSavingSmtp] = useState(false)
  const [togglingMaintenance, setTogglingMaintenance] = useState(false)
  const [twitchEditing, setTwitchEditing] = useState(false)
  const [twitchClientId, setTwitchClientId] = useState("")
  const [twitchClientSecret, setTwitchClientSecret] = useState("")
  const [savingTwitch, setSavingTwitch] = useState(false)
  const [syncCooldownValue, setSyncCooldownValue] = useState("")
  const [savingCooldown, setSavingCooldown] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      const [data, env] = await Promise.all([getSettings(), getEnvSettings()])
      setSettings(data)
      setEnvSettings(env)
      const maint = data.find((s) => s.key === "maintenance")
      setMaintenanceActive(maint?.value === "true")
      const cooldown = data.find((s) => s.key === "SYNC_COOLDOWN_SECONDS")
      setSyncCooldownValue(cooldown?.value ?? "300")
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
          <div className="flex items-center justify-between">
            <CardTitle>Mode maintenance</CardTitle>
            {maintenanceActive ? (
              <Badge variant="destructive">Maintenance active</Badge>
            ) : (
              <Badge variant="secondary">Maintenance inactive</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <CardDescription>Activer ou désactiver le mode maintenance de l&apos;application</CardDescription>
            <Button
              variant={maintenanceActive ? "destructive" : "outline"}
              size="sm"
              onClick={handleToggleMaintenance}
              disabled={togglingMaintenance}
              className="gap-2 shrink-0"
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
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Client Twitch</CardTitle>
            {isConfigured("TWITCH_CLIENT_ID") && isConfigured("TWITCH_CLIENT_SECRET") ? (
              <Badge variant="outline" className="text-emerald-600 border-emerald-600">Configuré</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Non configuré</Badge>
            )}
          </div>
          <CardDescription>Client ID et Client Secret de l'application Twitch</CardDescription>
        </CardHeader>
        <CardContent>
          {twitchEditing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Client ID</Label>
                <Input value={twitchClientId} onChange={(e) => setTwitchClientId(e.target.value)} placeholder="Client ID Twitch" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Client Secret</Label>
                <Input value={twitchClientSecret} onChange={(e) => setTwitchClientSecret(e.target.value)} type="password" placeholder="••••••••" className="h-9 text-sm" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" onClick={async () => {
                  setSavingTwitch(true)
                  try {
                    await saveSetting("TWITCH_CLIENT_ID", twitchClientId)
                    if (twitchClientSecret) await saveSetting("TWITCH_CLIENT_SECRET", twitchClientSecret)
                    setTwitchEditing(false)
                    await loadSettings()
                  } catch {}
                  setSavingTwitch(false)
                }} disabled={savingTwitch}>
                  {savingTwitch ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTwitchEditing(false)}>Annuler</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Client ID</Label>
                <p className="text-sm font-mono mt-0.5">{getValue("TWITCH_CLIENT_ID") || "Non configuré"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Client Secret</Label>
                <p className="text-sm font-mono mt-0.5">{isConfigured("TWITCH_CLIENT_SECRET") ? "••••••••" : "Non configuré"}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => {
                  setTwitchClientId(getValue("TWITCH_CLIENT_ID"))
                  setTwitchClientSecret("")
                  setTwitchEditing(true)
                }}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleTest("TWITCH_CLIENT_SECRET")} disabled={testing === "TWITCH_CLIENT_SECRET" || !isConfigured("TWITCH_CLIENT_ID") || !isConfigured("TWITCH_CLIENT_SECRET")}>
                  {testing === "TWITCH_CLIENT_SECRET" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tester"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {testResult && testResult.key === "TWITCH_CLIENT_SECRET" && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 rounded-md border px-4 py-3">
              {testResult.result.ok ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <span className="text-sm">{testResult.result.message}</span>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clé API Resend</CardTitle>
          <CardDescription>Service d&apos;envoi d&apos;emails utilisé pour les alertes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(SETTING_META).map(([key, meta]) => {
            if (key === "maintenance" || key.startsWith("SMTP_") || key === "TWITCH_CLIENT_ID" || key === "TWITCH_CLIENT_SECRET") return null
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
                </div>
              </div>
            )
          })}
        </CardContent>
        {testResult && testResult.key === "RESEND_API_KEY" && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 rounded-md border px-4 py-3">
              {testResult.result.ok ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <span className="text-sm">{testResult.result.message}</span>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cooldown de synchronisation</CardTitle>
          <CardDescription>Délai minimum (en secondes) entre deux synchronisations manuelles des drops Twitch et de la bibliothèque Steam</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              value={syncCooldownValue}
              onChange={(e) => setSyncCooldownValue(e.target.value)}
              className="h-9 text-sm w-32"
              placeholder="300"
            />
            <span className="text-sm text-muted-foreground">secondes</span>
            <Button
              size="sm"
              onClick={async () => {
                setSavingCooldown(true)
                try {
                  await saveSetting("SYNC_COOLDOWN_SECONDS", String(Number(syncCooldownValue) || 300))
                  await loadSettings()
                } catch {}
                setSavingCooldown(false)
              }}
              disabled={savingCooldown}
            >
              {savingCooldown ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configuration SMTP</CardTitle>
            {isConfigured("SMTP_HOST") && isConfigured("SMTP_USER") ? (
              <Badge variant="outline" className="text-emerald-600 border-emerald-600">Configuré</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Non configuré</Badge>
            )}
          </div>
          <CardDescription>Serveur SMTP pour l&apos;envoi des emails</CardDescription>
        </CardHeader>
        <CardContent>
          {smtpEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Serveur</Label>
                  <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Port</Label>
                  <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Utilisateur</Label>
                  <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="user@example.com" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Mot de passe</Label>
                  <Input value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} type="password" placeholder="••••••••" className="h-9 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" onClick={async () => {
                  setSavingSmtp(true)
                  try {
                    await saveSetting("SMTP_HOST", smtpHost)
                    await saveSetting("SMTP_PORT", smtpPort || "587")
                    await saveSetting("SMTP_USER", smtpUser)
                    if (smtpPass) await saveSetting("SMTP_PASS", smtpPass)
                    setSmtpEditing(false)
                    await loadSettings()
                  } catch {}
                  setSavingSmtp(false)
                }} disabled={savingSmtp}>
                  {savingSmtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSmtpEditing(false)}>Annuler</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Serveur</Label>
                  <p className="text-sm font-mono mt-0.5">{getValue("SMTP_HOST") || "Non configuré"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Port</Label>
                  <p className="text-sm font-mono mt-0.5">{getValue("SMTP_PORT") || "587"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Utilisateur</Label>
                  <p className="text-sm font-mono mt-0.5">{getValue("SMTP_USER") || "Non configuré"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mot de passe</Label>
                  <p className="text-sm font-mono mt-0.5">{isConfigured("SMTP_PASS") ? "••••••••" : "Non configuré"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => {
                  setSmtpHost(getValue("SMTP_HOST"))
                  setSmtpPort(getValue("SMTP_PORT") || "587")
                  setSmtpUser(getValue("SMTP_USER"))
                  setSmtpPass("")
                  setSmtpEditing(true)
                }}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleTest("SMTP")} disabled={testing === "SMTP" || !isConfigured("SMTP_HOST") || !isConfigured("SMTP_USER")}>
                  {testing === "SMTP" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tester"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {testResult && testResult.key === "SMTP" && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 rounded-md border px-4 py-3">
              {testResult.result.ok ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <span className="text-sm">{testResult.result.message}</span>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres d&apos;environnement</CardTitle>
          <CardDescription>Ces paramètres sont lus depuis le fichier .env (lecture seule)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {envSettings.map(({ key, label, value }) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-sm text-muted-foreground truncate font-mono mt-1">
                  {value || "Non défini"}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

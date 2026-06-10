"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, KeyRound } from "lucide-react"
import { requestOtp, downloadUserData } from "@/lib/actions/account"

export function DownloadCard() {
  const [step, setStep] = useState<"idle" | "sent" | "downloading">("idle")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleSendOtp() {
    setError(null)
    const result = await requestOtp("download")
    if (!result.ok) {
      setError(result.message)
      return
    }
    setStep("sent")
  }

  async function handleVerify() {
    setError(null)
    setStep("downloading")
    const result = await downloadUserData(code)
    if (!result.ok) {
      setError(result.message)
      setStep("sent")
      return
    }

    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mes-donnees.json"
    a.click()
    URL.revokeObjectURL(url)
    setStep("idle")
    setCode("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Télécharger mes données</CardTitle>
        <CardDescription>
          Récupère toutes tes données personnelles au format JSON.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          L&apos;archive peut contenir une liste volumineuse de jeux selon ta
          bibliothèque Steam. Les tokens et clés API ne sont pas inclus.
        </p>

        {step === "idle" && (
          <Button onClick={handleSendOtp}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger mes données
          </Button>
        )}

        {step === "sent" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Un code à 6 chiffres t&apos;a été envoyé par email.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="w-32"
              />
              <Button onClick={handleVerify}>
                <KeyRound className="h-4 w-4 mr-2" />
                Vérifier
              </Button>
            </div>
          </div>
        )}

        {step === "downloading" && (
          <p className="text-sm text-muted-foreground">Vérification en cours…</p>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}

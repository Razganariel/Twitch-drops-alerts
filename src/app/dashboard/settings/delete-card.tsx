"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, KeyRound } from "lucide-react"
import { requestOtp, deleteAccount } from "@/lib/actions/account"

const CONFIRM_TEXT = "SUPPRIMER"

export function DeleteAccountCard() {
  const [step, setStep] = useState<"idle" | "confirm" | "otp" | "deleting">("idle")
  const [confirmInput, setConfirmInput] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleRequestDelete() {
    setError(null)
    const result = await requestOtp("delete")
    if (!result.ok) {
      setError(result.message)
      return
    }
    setStep("otp")
  }

  async function handleConfirmDelete() {
    setError(null)
    setStep("deleting")
    const result = await deleteAccount(otpCode)
    if (!result.ok) {
      setError(result.message)
      setStep("otp")
      return
    }
    await signOut({ callbackUrl: "/" })
  }

  if (step === "idle") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supprimer mon compte</CardTitle>
          <CardDescription>
            Supprime définitivement ton compte et toutes les données associées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setStep("confirm")}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Supprimer mon compte
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === "confirm") {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer mon compte
          </CardTitle>
          <CardDescription>
            Tape <strong>{CONFIRM_TEXT}</strong> pour confirmer la suppression
            définitive de ton compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Toutes tes données seront définitivement supprimées. Si tu recrées
            un compte ultérieurement, tu devras tout reconnecter (Twitch,
            Steam) et réimporter ta bibliothèque.
          </p>
          <Input
            placeholder={CONFIRM_TEXT}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStep("idle")
                setConfirmInput("")
                setError(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={confirmInput !== CONFIRM_TEXT}
              onClick={handleRequestDelete}
            >
              Supprimer définitivement
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    )
  }

  if (step === "otp") {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <KeyRound className="h-5 w-5" />
            Code de confirmation
          </CardTitle>
          <CardDescription>
            Un code à 6 chiffres t&apos;a été envoyé par email. Saisis-le pour
            confirmer la suppression.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              className="w-32"
            />
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Confirmer la suppression
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-destructive/50">
      <CardContent className="py-6">
        <p className="text-sm text-muted-foreground">Suppression en cours…</p>
      </CardContent>
    </Card>
  )
}

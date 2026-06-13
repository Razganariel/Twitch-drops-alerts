"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Loader2, Power, ShieldCheck } from "lucide-react"
import { toggleMaintenance } from "@/lib/actions/admin"

export default function MaintenancePage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    fetch("/api/settings/check-admin")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin))
      .catch(() => setIsAdmin(false))
      .finally(() => setChecking(false))
  }, [])

  async function handleDisable() {
    setToggling(true)
    try {
      await toggleMaintenance()
      window.location.href = "/dashboard"
    } catch {}
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>

        <h1 className="text-3xl font-bold">Maintenance en cours</h1>

        <p className="text-muted-foreground">
          L&apos;application est temporairement en maintenance
          pour des améliorations. Veuillez réessayer plus tard.
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span>
            <Link href="/login" className="underline hover:text-foreground transition-colors">
              Connexion
            </Link>
            {" "}administrateur
          </span>
        </div>

        {!checking && isAdmin && (
          <button
            onClick={handleDisable}
            disabled={toggling}
            className="inline-flex items-center gap-2 h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            Désactiver le mode maintenance
          </button>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Power } from "lucide-react"
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
    <div className="flex flex-col min-h-svh">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Image
              src="/TwitchDropsSteam.png"
              alt="Twitch Drops Alerts"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-xl font-bold tracking-tight hidden sm:inline">
              Twitch Drops Alerts
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-8 text-center max-w-md">
          <Image
            src="/baniere-maintenance.png"
            alt="Maintenance"
            width={400}
            height={170}
            className="rounded-lg border shadow-xl w-full h-auto"
            loading="eager"
          />

          <h1 className="text-4xl font-bold tracking-tight">
            Maintenance en cours
          </h1>
          <p className="text-lg text-muted-foreground">
            L&apos;application est temporairement en maintenance
            pour des améliorations. Veuillez réessayer plus tard.
          </p>

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
      </main>

      <footer className="border-t py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Twitch Drops Alerts. Sous licence{" "}
            <Link
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              AGPL-3
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}

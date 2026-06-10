"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/shared/mode-toggle"
import { LogoutButton } from "./logout-button"

type Props = {
  unreadCount: number
}

export function DashboardSidebar({ unreadCount }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener("resize", close)
    return () => window.removeEventListener("resize", close)
  }, [])

  const nav = (
    <nav className="flex flex-col gap-2">
      <Link
        href="/dashboard"
        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
        onClick={() => setOpen(false)}
      >
        Dashboard
      </Link>
      <Link
        href="/dashboard/library"
        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
        onClick={() => setOpen(false)}
      >
        Bibliothèque
      </Link>
      <Link
        href="/dashboard/alerts"
        className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
        onClick={() => setOpen(false)}
      >
        <span>Alertes</span>
        {unreadCount > 0 && (
          <Badge variant="secondary" className="ml-auto">{unreadCount}</Badge>
        )}
      </Link>
      <Link
        href="/dashboard/settings"
        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
        onClick={() => setOpen(false)}
      >
        Paramètres
      </Link>
    </nav>
  )

  const secondaryNav = (
    <nav className="flex flex-col gap-2 shrink-0">
      <Link
        href="/privacy"
        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
        onClick={() => setOpen(false)}
      >
        Confidentialité
      </Link>
    </nav>
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background p-4
          transition-transform duration-200 ease-in-out
          md:static md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between mb-8 shrink-0">
          <Link href="/dashboard" className="text-lg font-semibold" onClick={() => setOpen(false)}>
            Twitch Drops
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {nav}
        </div>

        <div className="pt-4 border-t mb-4">
          {secondaryNav}
        </div>

        <div className="shrink-0 space-y-2 pt-4 border-t">
          <ModeToggle />
          <LogoutButton />
        </div>
      </aside>

      {/* Hamburger button (mobile only) */}
      <button
        className="fixed top-4 left-4 z-30 rounded-md bg-background p-2 shadow-md md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  )
}

"use client"

import { useRef, useActionState } from "react"
import { updateDashboardPreferences } from "@/lib/actions/settings"

type Props = {
  currentFilter: "ALL" | "MATCH"
  currentView: "GRID" | "LIST"
}

export function DashboardPreferencesForm({ currentFilter, currentView }: Props) {
  const [, action] = useActionState(updateDashboardPreferences, null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleChange() {
    formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} action={action}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium mb-2">Filtre par défaut du dashboard</p>
          <div className="flex flex-wrap gap-2">
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                currentFilter === "MATCH"
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="dashboardFilter"
                value="MATCH"
                defaultChecked={currentFilter === "MATCH"}
                onChange={handleChange}
                className="sr-only"
              />
              Matchs
            </label>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                currentFilter === "ALL"
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="dashboardFilter"
                value="ALL"
                defaultChecked={currentFilter === "ALL"}
                onChange={handleChange}
                className="sr-only"
              />
              Toutes
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Affichage par défaut du dashboard</p>
          <div className="flex flex-wrap gap-2">
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                currentView === "GRID"
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="dashboardView"
                value="GRID"
                defaultChecked={currentView === "GRID"}
                onChange={handleChange}
                className="sr-only"
              />
              Grille
            </label>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                currentView === "LIST"
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="dashboardView"
                value="LIST"
                defaultChecked={currentView === "LIST"}
                onChange={handleChange}
                className="sr-only"
              />
              Liste
            </label>
          </div>
        </div>
      </div>
    </form>
  )
}

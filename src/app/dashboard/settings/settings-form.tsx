"use client"

import { useRef, useActionState } from "react"
import { updateCheckInterval } from "@/lib/actions/settings"

const INTERVALS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 heure" },
  { value: 240, label: "4 heures" },
  { value: 720, label: "12 heures" },
  { value: 1440, label: "24 heures" },
] as const

type Props = {
  currentInterval: number
}

export function SettingsForm({ currentInterval }: Props) {
  const [, action] = useActionState(updateCheckInterval, null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleChange() {
    formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} action={action}>
      <div className="flex flex-wrap gap-3">
        {INTERVALS.map(({ value, label }) => {
          const checked = currentInterval === value
          return (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                checked
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="interval"
                value={value}
                defaultChecked={checked}
                onChange={handleChange}
                className="sr-only"
              />
              {label}
            </label>
          )
        })}
      </div>
    </form>
  )
}

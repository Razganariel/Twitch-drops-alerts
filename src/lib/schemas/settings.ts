import { z } from "zod"

export const checkIntervalValues = [1, 5, 15, 30, 60, 240, 720, 1440] as const

export const checkIntervalSchema = z.object({
  interval: z.coerce.number().refine(
    (v) => (checkIntervalValues as readonly number[]).includes(v),
    "Intervalle invalide"
  ),
})

const dashboardFilterValues = ["ALL", "MATCH"] as const
const dashboardViewValues = ["GRID", "LIST"] as const

export const dashboardPreferencesSchema = z.object({
  dashboardFilter: z.enum(dashboardFilterValues, "Filtre invalide"),
  dashboardView: z.enum(dashboardViewValues, "Vue invalide"),
})

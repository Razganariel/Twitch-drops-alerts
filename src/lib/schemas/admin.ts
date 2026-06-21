import { z } from "zod"
import { stripHtml } from "./helpers"

export const settingSchema = z.object({
  key: z.string().min(1, "Clé requise").max(100, "Maximum 100 caractères").trim().transform(stripHtml),
  value: z.string().max(500, "Maximum 500 caractères").transform(stripHtml),
})

import { z } from "zod"
import { stripHtml } from "./helpers"

export const steamIdPattern = /^\d{17}$/

export const steamSchema = z.object({
  steamId: z.string().regex(steamIdPattern, "Steam ID invalide (17 chiffres)").optional().or(z.literal("")),
  username: z.string().min(2, "Minimum 2 caractères").max(50, "Maximum 50 caractères").trim().transform(stripHtml).optional().or(z.literal("")),
  apiKey: z.string().length(32, "La clé API Steam fait 32 caractères").transform(stripHtml).optional().or(z.literal("")),
})

import { z } from "zod"
import { stripHtml } from "./helpers"

export const loginSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères").max(128, "Maximum 128 caractères").transform(stripHtml),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères").max(50, "Maximum 50 caractères").trim().transform(stripHtml),
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères").max(128, "Maximum 128 caractères").transform(stripHtml),
})

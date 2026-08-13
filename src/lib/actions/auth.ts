"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { encrypt, hashValue } from "@/lib/encryption"
import { registerSchema } from "@/lib/schemas/auth"
import { checkRateLimit } from "@/lib/rate-limit"

export async function registerUser(_prevState: string | undefined, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const firstError = Object.values(errors).flat()[0]
    return firstError ?? "Données invalides"
  }

  const { name, email, password } = parsed.data

  const emailHash = hashValue(email)
  if (!checkRateLimit(`register:${emailHash}`)) {
    return "Trop de tentatives, réessaye dans 15 minutes"
  }

  const existing = await prisma.user.findUnique({ where: { emailHash } })
  if (existing) {
    return "Un compte avec cet email existe déjà"
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name: encrypt(name),
      email: encrypt(email),
      emailHash,
      password: hashedPassword,
    },
  })

  return undefined
}

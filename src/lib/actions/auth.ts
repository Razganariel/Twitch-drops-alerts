"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { encrypt, hashValue } from "@/lib/encryption"

export async function registerUser(_prevState: string | undefined, formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const emailHash = hashValue(email)
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

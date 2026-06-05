"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function saveTwitchCredentials(
  _prevState: { ok: boolean; message: string } | null,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: "Non authentifié" }

  const clientId = formData.get("clientId") as string
  const clientSecret = formData.get("clientSecret") as string

  if (!clientId || !clientSecret) {
    return { ok: false, message: "Client ID et Client Secret requis" }
  }

  await prisma.twitchConnection.upsert({
    where: { userId: session.user.id },
    update: { clientId, clientSecret },
    create: {
      userId: session.user.id,
      clientId,
      clientSecret,
    },
  })

  return { ok: true, message: "Identifiants Twitch enregistrés" }
}

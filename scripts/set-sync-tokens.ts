import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { encrypt } from "../src/lib/encryption"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  const accessToken = process.argv[2]
  const refreshToken = process.argv[3]
  const expiresIn = Number(process.argv[4]) || 14400

  if (!accessToken || !refreshToken) {
    console.error("Usage: npx tsx scripts/set-sync-tokens.ts <access_token> <refresh_token> [expires_in]")
    console.error("\nPour obtenir les tokens, exécute le device flow LOCALEMENT :")
    console.error("  npx tsx scripts/setup-sync-account.ts")
    console.error("\nPuis copie les tokens depuis la sortie (après le poll réussi).")
    process.exit(1)
  }

  await prisma.syncAccount.upsert({
    where: { service: "twitch-gql" },
    update: {
      accessToken: encrypt(accessToken),
      refreshToken: encrypt(refreshToken),
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    },
    create: {
      service: "twitch-gql",
      accessToken: encrypt(accessToken),
      refreshToken: encrypt(refreshToken),
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    },
  })

  console.log("✅ Tokens du compte de service enregistrés")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error("❌ Erreur :", e)
  process.exit(1)
})

import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { encrypt } from "../src/lib/encryption"
import { startDeviceFlow, pollDeviceFlow } from "../src/services/twitch"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  console.log("\n🔑 Configuration du compte de service Twitch")
  console.log("─".repeat(50))
  console.log("1️⃣  Démarrage du device flow…\n")

  const botClientId = process.env.TWITCH_BOT_CLIENT_ID
  const flow = await startDeviceFlow(botClientId)

  console.log(`   Rends-toi sur : ${flow.verification_uri}`)
  console.log(`   Code          : ${flow.user_code}`)
  console.log(`   Expire dans   : ${flow.expires_in} secondes\n`)
  console.log("2️⃣  Autorise l'application dans ton navigateur.")
  console.log("   Le script attend automatiquement la validation.\n")

  const intervalMs = flow.interval * 1000

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs))

    const tokens = await pollDeviceFlow(flow.device_code, botClientId)

    if (!tokens) {
      process.stdout.write(".")
      continue
    }

    console.log("\n\n3️⃣  Stockage des tokens…")

    await prisma.syncAccount.upsert({
      where: { service: "twitch-gql" },
      update: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        expiresAt: new Date(Date.now() + (tokens.expires_in ?? 14400) * 1000),
      },
      create: {
        service: "twitch-gql",
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        expiresAt: new Date(Date.now() + (tokens.expires_in ?? 14400) * 1000),
      },
    })

    console.log("✅ Compte de service configuré avec succès !")
    console.log(`   Le token sera refreshé automatiquement.\n`)
    console.log("─".repeat(50))
    console.log("Pour déployer ces tokens sur le serveur de prod :")
    console.log(`  npx tsx scripts/set-sync-tokens.ts "${tokens.access_token}" "${tokens.refresh_token}" ${tokens.expires_in ?? 14400}`)
    console.log("─".repeat(50))

    await prisma.$disconnect()
    process.exit(0)
  }
}

main().catch((e) => {
  console.error("❌ Erreur :", e)
  process.exit(1)
})

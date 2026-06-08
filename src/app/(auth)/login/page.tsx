import type { Metadata } from "next"
import { LoginForm } from "./login-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Connexion",
}

export default function LoginPage() {
  const twitchEnabled = !!(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET)

  return <LoginForm twitchEnabled={twitchEnabled} />
}

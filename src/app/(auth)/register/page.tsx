import type { Metadata } from "next"
import { RegisterForm } from "./register-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Inscription",
}

export default function RegisterPage() {
  const twitchEnabled = !!(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET)

  return <RegisterForm twitchEnabled={twitchEnabled} />
}

import type { Metadata } from "next"
import { LoginForm } from "./login-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Connexion",
}

const twitchErrorMessages: Record<string, string> = {
  OAuthAccountNotLinked:
    "Un compte existe déjà avec l'email de ce compte Twitch. Connecte-toi avec ton email, puis lie ton compte Twitch depuis les Paramètres.",
  AccessDenied: "Accès refusé par Twitch.",
  default: "Connexion avec Twitch annulée.",
}

export default async function LoginPage(props: { searchParams?: Promise<{ error?: string }> }) {
  const twitchEnabled = !!(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET)
  const searchParams = await props.searchParams
  const twitchError = searchParams?.error
    ? twitchErrorMessages[searchParams.error] ?? twitchErrorMessages.default
    : null

  return <LoginForm twitchEnabled={twitchEnabled} twitchError={twitchError} />
}

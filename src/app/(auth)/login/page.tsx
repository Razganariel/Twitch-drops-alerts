import { LoginForm } from "./login-form"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  const twitchEnabled = !!(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET)

  return <LoginForm twitchEnabled={twitchEnabled} />
}

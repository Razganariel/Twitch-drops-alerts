import nodemailer from "nodemailer"

export async function testTwitchClientId(clientId: string) {
  const url = `https://api.twitch.tv/helix/users?login=twitchdev`
  const res = await fetch(url, {
    headers: { "Client-ID": clientId },
  })
  if (res.status === 401) return { ok: false, message: "Client ID invalide" }
  if (!res.ok) return { ok: false, message: `Erreur API Twitch: ${res.status}` }
  return { ok: true, message: "Client ID valide" }
}

export async function testTwitchCredentials(clientId: string, clientSecret: string) {
  const url = "https://id.twitch.tv/oauth2/token"
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  })
  const res = await fetch(url, { method: "POST", body: params })
  if (!res.ok) return { ok: false, message: "Identifiants Twitch invalides" }
  return { ok: true, message: "Identifiants Twitch valides" }
}

export async function testResend(apiKey: string, testEmail: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "test@twitch-drops-alerts.duckdns.org",
      to: testEmail,
      subject: "Test de configuration",
      text: "Ceci est un email de test depuis l'interface d'administration.",
    }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    return { ok: false, message: (error as { message?: string }).message ?? "Erreur API Resend" }
  }
  return { ok: true, message: "Email de test envoyé" }
}

export async function testSmtp(
  host: string,
  port: number,
  user: string,
  pass: string,
  testEmail: string
) {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  try {
    await transporter.verify()
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Connexion SMTP échouée" }
  }

  try {
    await transporter.sendMail({
      from: user,
      to: testEmail,
      subject: "Test de configuration SMTP",
      text: "Ceci est un email de test depuis l'interface d'administration.",
    })
    return { ok: true, message: "Email de test envoyé" }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Envoi SMTP échoué" }
  }
}

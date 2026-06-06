import { Resend } from "resend"

let resend: Resend | null = null

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return null
    resend = new Resend(apiKey)
  }
  return resend
}

export async function sendAlertEmail(params: {
  to: string
  gameName: string
  campaignName: string
  rewardName?: string | null
  requiredMinutesWatched?: number | null
  endAt: Date
}) {
  const client = getResend()
  if (!client) return

  const rewardLine = params.rewardName
    ? `Récompense : ${params.rewardName}`
    : ""

  const minutesLine = params.requiredMinutesWatched
    ? `${params.requiredMinutesWatched} minutes de visionnage requises`
    : ""

  const endDate = new Date(params.endAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  await client.emails.send({
    from: process.env.EMAIL_FROM ?? "Twitch Drops Alerts <noreply@ton-domaine.com>",
    to: params.to,
    subject: `Drop disponible : ${params.gameName}`,
    text: [
      `Un drop est disponible pour ${params.gameName} !`,
      ``,
      `Campagne : ${params.campaignName}`,
      rewardLine,
      minutesLine,
      `Se termine le : ${endDate}`,
      ``,
      `Connecte-toi sur Twitch pour commencer à regarder et obtenir la récompense.`,
    ]
      .filter(Boolean)
      .join("\n"),
  })
}

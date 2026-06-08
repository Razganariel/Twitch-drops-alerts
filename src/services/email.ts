import { Resend } from "resend"
import nodemailer from "nodemailer"

let resend: Resend | null = null
let smtpTransport: nodemailer.Transporter | null = null

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return null
    resend = new Resend(apiKey)
  }
  return resend
}

function getSmtpTransport() {
  if (!smtpTransport) {
    const host = process.env.SMTP_HOST
    if (!host) return null
    smtpTransport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  }
  return smtpTransport
}

type DropItemData = {
  name: string
  rewardName: string | null
  rewardImageUrl: string | null
  requiredMinutesWatched: number | null
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })
}

const APP_URL = process.env.APP_URL || "https://twitch-drops-alerts.duckdns.org"

function buildWatchItems(items: DropItemData[]) {
  return items.filter((i) => i.requiredMinutesWatched != null && i.requiredMinutesWatched > 0)
}

function buildSubItems(items: DropItemData[]) {
  return items.filter((i) => i.requiredMinutesWatched == null || i.requiredMinutesWatched === 0)
}

function buildItemsSection(items: DropItemData[], title: string, icon: string) {
  if (items.length === 0) return ""

  return `
    <tr>
      <td style="padding:0 32px 12px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#9147ff;text-transform:uppercase;letter-spacing:0.5px;">
          ${icon} ${title}
        </p>
      </td>
    </tr>
    ${items.map((item, i) => `
    <tr>
      <td style="padding:${i === 0 ? "0" : "8"}px 32px ${i === items.length - 1 ? "20" : "0"}px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:8px;">
          <tr>
            ${item.rewardImageUrl ? `
            <td width="64" style="padding:8px;">
              <img src="${item.rewardImageUrl}" alt="" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:6px;object-fit:cover;" />
            </td>
            ` : ""}
            <td style="padding:8px 12px;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#18181b;">
                ${item.rewardName ?? item.name}
              </p>
              ${item.requiredMinutesWatched != null ? `
              <p style="margin:2px 0 0;font-size:12px;color:#71717a;">
                ${item.requiredMinutesWatched} min de visionnage
              </p>
              ` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    `).join("")}`
}

function gameImageUrl(steamAppId: number | null, boxArtUrl: string | null) {
  if (steamAppId) {
    return `https://cdn.steamstatic.com/steam/apps/${steamAppId}/header.jpg`
  }
  return boxArtUrl
}

function buildHtml(params: {
  gameName: string
  gameBoxArtUrl: string | null
  gameSteamAppId: number | null
  dropName: string
  startAt: Date
  endAt: Date
  twitchUrl: string
  dropItems?: DropItemData[] | null
}) {
  const items = params.dropItems ?? []
  const watchItems = buildWatchItems(items)
  const subItems = buildSubItems(items)

  const hasItems = watchItems.length > 0 || subItems.length > 0

  const gameImg = gameImageUrl(params.gameSteamAppId, params.gameBoxArtUrl)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Drop Twitch disponible</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:0;">
              <img src="${APP_URL}/baniere-email.png" alt="Drop Twitch disponible !" width="560" style="display:block;width:100%;max-width:560px;height:auto;" />
            </td>
          </tr>

          ${gameImg ? `
          <tr>
            <td style="padding:24px 32px 0;text-align:center;">
              <img src="${gameImg}" alt="${params.gameName}" width="480" style="display:block;width:100%;max-width:480px;height:auto;border-radius:10px;margin:0 auto;" />
            </td>
          </tr>
          ` : ""}

          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0 0 4px;font-size:13px;color:#71717a;">Jeu</p>
              <p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#18181b;">
                ${params.gameName}
              </p>

              <p style="margin:0 0 4px;font-size:13px;color:#71717a;">Campagne</p>
              <p style="margin:0 0 20px;font-size:16px;color:#27272a;">
                ${params.dropName}
              </p>

              <p style="margin:0 0 4px;font-size:13px;color:#71717a;">Période</p>
              <p style="margin:0 0 24px;font-size:15px;color:#27272a;">
                du ${formatDateShort(params.startAt)} au ${formatDate(params.endAt)}
              </p>
            </td>
          </tr>

          ${hasItems ? `
          <tr>
            <td style="padding:0 32px 8px;border-top:1px solid #e4e4e7;">
              <p style="margin:16px 0 12px;font-size:15px;font-weight:600;color:#18181b;">
                🏆 À gagner
              </p>
            </td>
          </tr>
          ${watchItems.length > 0 ? buildItemsSection(watchItems, "Visionnage", "🎬") : ""}
          ${subItems.length > 0 ? buildItemsSection(subItems, "Abonnement", "⭐") : ""}
          ` : ""}

          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${params.twitchUrl}"
                       style="display:inline-block;padding:14px 36px;border-radius:8px;background-color:#9147ff;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">
                      Voir sur Twitch
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
                Tu reçois cet email car tu as activé les alertes de drops sur
                <a href="${APP_URL}" style="color:#9147ff;text-decoration:none;">Twitch Drops Alerts</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendDropAlert(params: {
  to: string
  gameName: string
  gameBoxArtUrl: string | null
  gameSteamAppId: number | null
  dropName: string
  startAt: Date
  endAt: Date
  twitchUrl: string
  dropItems: DropItemData[]
}) {
  const client = getResend()
  const transport = getSmtpTransport()

  if (!client && !transport) {
    console.warn(
      `[email] No email provider configured. Set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS.`
    )
    return
  }

  const html = buildHtml(params)
  const subject = `🎮 Drop Twitch disponible pour ${params.gameName} !`
  const from = process.env.EMAIL_FROM ?? "Twitch Drops Alerts <noreply@default.com>"

  if (client) {
    await client.emails.send({ from, to: params.to, subject, html })
    return
  }

  await transport!.sendMail({ from, to: params.to, subject, html })
}

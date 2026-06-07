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

function buildHtml(params: { gameName: string; dropName: string; endAt: Date; twitchUrl: string }) {
  const endDate = new Date(params.endAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

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
        <table role="presentation" width="100%" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#9147ff,#772ce8);">
              <span style="font-size:48px;line-height:1;">🎮</span>
              <h1 style="margin:12px 0 0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Drop Twitch disponible&nbsp;!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Jeu</p>
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#18181b;">
                ${params.gameName}
              </p>

              <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Campagne</p>
              <p style="margin:0 0 24px;font-size:16px;color:#27272a;">
                ${params.dropName}
              </p>

              <p style="margin:0 0 8px;font-size:14px;color:#71717a;">Date de fin</p>
              <p style="margin:0 0 28px;font-size:16px;color:#27272a;">
                ${endDate}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${params.twitchUrl}"
                       style="display:inline-block;padding:14px 32px;border-radius:8px;background-color:#9147ff;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">
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
                Tu reçois cet email car tu as activé les alertes de drops sur Twitch Drops Alerts.
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
  dropName: string
  endAt: Date
  twitchUrl: string
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

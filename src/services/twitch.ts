const TWITCH_API_BASE = "https://api.twitch.tv/helix"
const TWITCH_AUTH_BASE = "https://id.twitch.tv/oauth2"

function getClientId() {
  return process.env.TWITCH_CLIENT_ID ?? process.env.AUTH_TWITCH_ID ?? ""
}

function getClientSecret() {
  return process.env.TWITCH_CLIENT_SECRET ?? process.env.AUTH_TWITCH_SECRET ?? ""
}

async function fetchWithToken(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": getClientId(),
    },
  })

  if (!response.ok) {
    throw new Error(`Twitch API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getTwitchUserId(accessToken: string) {
  const data = await fetchWithToken(`${TWITCH_API_BASE}/users`, accessToken)
  return data.data?.[0] ?? null
}

export async function getActiveDrops(accessToken: string) {
  const data = await fetchWithToken(
    `${TWITCH_API_BASE}/drops/entitlements?fulfillment_statuses=ACTIVE`,
    accessToken
  )
  return data.data ?? []
}

export async function refreshTwitchToken(refreshToken: string) {
  const response = await fetch(`${TWITCH_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to refresh Twitch token")
  }

  return response.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}

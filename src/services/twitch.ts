const TWITCH_API_BASE = "https://api.twitch.tv/helix"
const TWITCH_AUTH_BASE = "https://id.twitch.tv/oauth2"

async function fetchWithToken(url: string, accessToken: string, clientId: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": clientId,
    },
  })

  if (!response.ok) {
    throw new Error(`Twitch API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function getTwitchAuthUrl(clientId: string, redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user:read:email user:read:follows",
    state,
  })
  return `${TWITCH_AUTH_BASE}/authorize?${params.toString()}`
}

export async function exchangeTwitchCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  const response = await fetch(`${TWITCH_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to exchange Twitch code")
  }

  return response.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}

export async function getTwitchUserId(accessToken: string, clientId: string) {
  const data = await fetchWithToken(`${TWITCH_API_BASE}/users`, accessToken, clientId)
  return data.data?.[0] ?? null
}

export async function getActiveDrops(accessToken: string, clientId: string) {
  const data = await fetchWithToken(
    `${TWITCH_API_BASE}/drops/entitlements?fulfillment_statuses=ACTIVE`,
    accessToken,
    clientId
  )
  return data.data ?? []
}

export type FollowedStream = {
  gameId: string
  gameName: string
  thumbnailUrl: string
}

export async function getFollowedStreams(
  accessToken: string,
  clientId: string
): Promise<FollowedStream[]> {
  const url = `${TWITCH_API_BASE}/streams/followed?first=100`
  const data = await fetchWithToken(url, accessToken, clientId)
  return (data.data ?? []).map(
    (s: { game_id: string; game_name: string; thumbnail_url: string }) => ({
      gameId: s.game_id,
      gameName: s.game_name,
      thumbnailUrl: s.thumbnail_url,
    })
  )
}

export async function refreshTwitchToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
) {
  const response = await fetch(`${TWITCH_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
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

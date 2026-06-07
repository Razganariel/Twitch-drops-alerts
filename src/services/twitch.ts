const TWITCH_API_BASE = "https://api.twitch.tv/helix"
const TWITCH_AUTH_BASE = "https://id.twitch.tv/oauth2"
const TWITCH_GQL_BASE = "https://gql.twitch.tv/gql"
const TWITCH_ANDROID_CLIENT_ID = "kd1unb4b3q4t58fwlpcbzcbnm76a8fp"

const gqlSessionId = crypto.randomUUID()
const gqlDeviceId = crypto.randomUUID()

async function fetchWithToken(url: string, accessToken: string, clientId: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": clientId,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Twitch API error: ${response.status} ${response.statusText} — ${body}`)
  }

  return response.json()
}

async function fetchGQL(
  accessToken: string,
  operationName: string,
  hash: string,
  variables: Record<string, unknown> = {}
) {
  const response = await fetch(TWITCH_GQL_BASE, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${accessToken}`,
      "Client-Id": TWITCH_ANDROID_CLIENT_ID,
      "Content-Type": "application/json",
      "Client-Session-Id": gqlSessionId,
      "X-Device-Id": gqlDeviceId,
      "User-Agent":
        "Dalvik/2.1.0 (Linux; U; Android 7.1.2; SM-G977N Build/LMY48Z) tv.twitch.android.app/16.8.1/1608010",
      Origin: "https://www.twitch.tv",
      Referer: "https://www.twitch.tv",
    },
    body: JSON.stringify({
      operationName,
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: hash,
        },
      },
      variables,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Twitch GQL error: ${response.status} ${response.statusText} — ${body}`)
  }

  return response.json() as Promise<{ data?: Record<string, unknown>; errors?: Array<{ message: string }> }>
}

export async function getTwitchUserId(accessToken: string, clientId: string) {
  const data = await fetchWithToken(`${TWITCH_API_BASE}/users`, accessToken, clientId)
  return data.data?.[0] ?? null
}

export type FollowedChannel = {
  gameId: string
  gameName: string
  thumbnailUrl: string
}

export async function getFollowedStreams(
  accessToken: string,
  clientId: string,
  userId: string
): Promise<FollowedChannel[]> {
  const allChannels: Array<{ broadcaster_id: string }> = []
  let cursor: string | null = null

  do {
    const params = new URLSearchParams({ user_id: userId, first: "100" })
    if (cursor) params.set("after", cursor)

    const data = await fetchWithToken(
      `${TWITCH_API_BASE}/channels/followed?${params}`,
      accessToken,
      clientId
    )

    allChannels.push(...(data.data ?? []))
    cursor = data.pagination?.cursor ?? null
  } while (cursor)

  if (allChannels.length === 0) return []

  const seen = new Set<string>()
  const results: FollowedChannel[] = []

  for (let i = 0; i < allChannels.length; i += 100) {
    const batch = allChannels.slice(i, i + 100)
    const params = new URLSearchParams()
    for (const ch of batch) {
      params.append("user_id", ch.broadcaster_id)
    }

    const data = await fetchWithToken(
      `${TWITCH_API_BASE}/streams?${params}`,
      accessToken,
      clientId
    )

    for (const s of data.data ?? []) {
      if (seen.has(s.game_id)) continue
      seen.add(s.game_id)
      results.push({
        gameId: s.game_id,
        gameName: s.game_name,
        thumbnailUrl: s.thumbnail_url,
      })
    }
  }

  return results
}

export type TwitchDropCampaign = {
  id: string
  name: string
  status: string
  startAt: string
  endAt: string
  game: {
    id: string
    name: string
    displayName: string
    boxArtURL?: string
  } | null
  imageURL?: string
  timeBasedDrops?: Array<{
    id: string
    name: string
    requiredMinutesWatched: number
    reward?: { id: string; name: string; imageURL?: string }
  }>
  self?: { isAccountConnected: boolean }
}

export type DeviceFlowResponse = {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export async function startDeviceFlow(): Promise<DeviceFlowResponse> {
  const response = await fetch(`${TWITCH_AUTH_BASE}/device`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: TWITCH_ANDROID_CLIENT_ID,
      scopes: "user:read:follows",
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Twitch device flow error: ${response.status} — ${body}`)
  }

  return response.json()
}

export async function pollDeviceFlow(
  deviceCode: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const response = await fetch(`${TWITCH_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: TWITCH_ANDROID_CLIENT_ID,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
  })

  if (response.status === 400) {
    const body = await response.json()
    const err = body.error ?? body.message ?? ""
    if (err === "authorization_pending") return null
    if (err === "slow_down") return null
    throw new Error(`Twitch device flow error: ${body.error} — ${body.message ?? ""}`)
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Twitch device flow error: ${response.status} — ${body}`)
  }

  return response.json()
}

export async function refreshGqlToken(refreshToken: string) {
  const response = await fetch(`${TWITCH_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: TWITCH_ANDROID_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to refresh GQL token: ${response.status} ${body}`)
  }

  return response.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}

export async function getActiveDropCampaigns(
  accessToken: string
): Promise<TwitchDropCampaign[]> {
  const json = await fetchGQL(
    accessToken,
    "ViewerDropsDashboard",
    "5a4da2ab3d5b47c9f9ce864e727b2cb346af1e3ea8b897fe8f704a97ff017619",
    { fetchRewardCampaigns: false }
  )

  if (json.errors) {
    throw new Error(
      `Twitch GQL error: ${json.errors.map((e) => e.message).join(", ")}`
    )
  }

  const campaigns = (json.data?.currentUser as Record<string, unknown>)
    ?.dropCampaigns as TwitchDropCampaign[] | undefined

  return (
    campaigns?.filter((c) => c.status === "ACTIVE" && c.game) ?? []
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

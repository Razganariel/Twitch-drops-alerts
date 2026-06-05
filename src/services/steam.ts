const STEAM_API_BASE = "https://api.steampowered.com"

export type SteamGame = {
  appid: number
  name: string
  img_logo_url?: string
}

type GetOwnedGamesResponse = {
  response: {
    games?: SteamGame[]
    game_count?: number
  }
}

type ResolveVanityUrlResponse = {
  response: {
    steamid?: string
    success: number
    message?: string
  }
}

export async function getSteamLibrary(steamId: string, apiKey: string) {
  const url = `${STEAM_API_BASE}/ISteamUser/GetOwnedGames/v1?key=${apiKey}&steamid=${steamId}&include_appinfo=true&format=json`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Steam API error: ${response.status}`)
  }

  const data = (await response.json()) as GetOwnedGamesResponse
  return data.response.games ?? []
}

export async function resolveSteamVanityUrl(username: string, apiKey: string) {
  const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1?key=${apiKey}&vanityurl=${username}&format=json`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Steam API error: ${response.status}`)
  }

  const data = (await response.json()) as ResolveVanityUrlResponse

  if (data.response.success !== 1) {
    throw new Error(data.response.message ?? "Failed to resolve Steam username")
  }

  return data.response.steamid!
}

export function getSteamLogoUrl(appid: number, logoUrl?: string) {
  if (!logoUrl) return null
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${logoUrl}.jpg`
}

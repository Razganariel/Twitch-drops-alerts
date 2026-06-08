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
  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&include_free_sub=true&format=json`

  const response = await fetch(url)
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Clé API Steam invalide ou révoquée")
    }
    if (response.status === 404) {
      throw new Error(
        "Profil Steam introuvable : vérifie l'ID et que ta bibliothèque de jeux est publique (Profil → Modifier profil → Confidentialité → Jeux → Public)"
      )
    }
    throw new Error(`Erreur API Steam: ${response.status}`)
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
    if (data.response.message === "No match") {
      throw new Error(
        "Aucun pseudo Steam personnalisé trouvé. Si tu n'as pas d'URL /id/..., utilise directement ton ID numérique Steam."
      )
    }
    throw new Error(data.response.message ?? "Impossible de trouver ce profil Steam")
  }

  return data.response.steamid!
}

export function getSteamLogoUrl(appid: number, logoHash?: string) {
  if (logoHash) {
    if (logoHash.startsWith("http")) return logoHash
    return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${logoHash}.jpg`
  }
  return `https://cdn.steamstatic.com/steam/apps/${appid}/header.jpg`
}

const STORE_SEARCH_URL = "https://store.steampowered.com/api/storesearch"

export type SteamSearchResult = {
  id: number
  name: string
  tiny_image: string
  price?: { final: number; currency: string }
}

type StoreSearchResponse = {
  items: SteamSearchResult[]
  total: number
}

export async function searchSteamStorefront(query: string, limit = 20): Promise<SteamSearchResult[]> {
  const url = `${STORE_SEARCH_URL}?term=${encodeURIComponent(query)}&l=fr&cc=FR&category1=998&count=${limit}`
  const response = await fetch(url)
  if (!response.ok) return []

  const data = (await response.json()) as StoreSearchResponse
  return data.items ?? []
}

export async function getGameDetails(appid: number): Promise<{ name: string; steamAppId: number }> {
  const url = `${STORE_SEARCH_URL}?term=${appid}&l=fr&cc=FR&category1=998`
  const response = await fetch(url)
  if (!response.ok) throw new Error("Impossible de récupérer les détails du jeu")

  const data = (await response.json()) as StoreSearchResponse
  const item = data.items?.find((i) => i.id === appid)
  if (!item) throw new Error("Jeu introuvable")

  return { name: item.name, steamAppId: item.id }
}

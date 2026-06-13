"use client"

import { useState, useRef, useCallback } from "react"
import { Search, ExternalLink, Trash2, RotateCcw, Bell, BellOff, Plus, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toggleGameAlert, softDeleteGame, restoreGame, toggleAllAlerts, addGameToLibrary } from "@/lib/actions/library"

type GameEntry = {
  id: string
  steamAppId: number
  name: string
  logoUrl: string | null
  isAlertEnabled: boolean
  deletedAt: string | null
}

type Props = {
  games: GameEntry[]
}

type SearchResult = {
  id: number
  name: string
  tiny_image: string
}

export function LibraryClient({ games }: Props) {
  const [search, setSearch] = useState("")
  const [filterDeleted, setFilterDeleted] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)

  const allEnabled = games.filter((g) => !g.deletedAt).every((g) => g.isAlertEnabled) && games.filter((g) => !g.deletedAt).length > 0

  const shown = games.filter((g) => {
    const searchMatch = !search || g.name.toLowerCase().includes(search.toLowerCase())
    if (!searchMatch) return false

    const conditions: boolean[] = []
    if (filterDeleted) conditions.push(!!g.deletedAt)

    if (conditions.length === 0) return !g.deletedAt
    return conditions.some(Boolean)
  })

  return (
    <>
      <div className="min-h-0 flex-1 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Bibliothèque Steam</h1>
          <span className="text-sm text-muted-foreground">{games.length} jeux</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px] max-w-sm w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un jeu..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowSearchModal(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter un jeu
            </Button>
            <Button
              variant={filterDeleted ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterDeleted(!filterDeleted)}
            >
              Supprimés
            </Button>
          </div>

          <form action={toggleAllAlerts} className="shrink-0">
            <input type="hidden" name="enabled" value={String(!allEnabled)} />
            <Button variant="outline" size="sm" type="submit">
              {allEnabled ? (
                <>
                  <BellOff className="h-4 w-4 mr-1" /> Désactiver tout
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-1" /> Activer tout
                </>
              )}
            </Button>
          </form>
        </div>

        <Card className="flex flex-col flex-1 overflow-hidden min-h-0">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-lg">Bibliothèque ({shown.length})</CardTitle>
            <CardDescription>
              Les jeux avec les alertes activées généreront des notifications lors des drops.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {shown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun jeu trouvé.</p>
            ) : (
              <div className="divide-y">
                {shown.map((game) => (
                  <GameRow key={game.id} game={game} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showSearchModal && (
        <SearchModal onClose={() => setShowSearchModal(false)} />
      )}
    </>
  )
}

function GameRow({ game }: { game: GameEntry }) {
  const isDeleted = !!game.deletedAt

  return (
    <div className={`flex items-center gap-3 py-3 ${isDeleted ? "opacity-50" : ""}`}>
      {game.logoUrl ? (
        <img src={game.logoUrl} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
      ) : (
        <div className="h-10 w-10 rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
          N/A
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDeleted ? "line-through" : ""}`}>
          {game.name}
        </p>
        <p className="text-xs text-muted-foreground">App ID: {game.steamAppId}</p>
      </div>

      <a
        href={`https://steamdb.info/app/${game.steamAppId}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-primary shrink-0"
        title="Ouvrir sur SteamDB"
      >
        <ExternalLink className="h-4 w-4" />
      </a>

      {isDeleted ? (
        <form action={restoreGame}>
          <input type="hidden" name="gameId" value={game.id} />
          <Button variant="ghost" size="sm" className="h-8" type="submit">
            <RotateCcw className="h-4 w-4 mr-1" /> Restaurer
          </Button>
        </form>
      ) : (
        <>
          <form action={toggleGameAlert}>
            <input type="hidden" name="gameId" value={game.id} />
            <input type="hidden" name="enabled" value={String(!game.isAlertEnabled)} />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" type="submit">
              {game.isAlertEnabled ? (
                <Bell className="h-4 w-4 text-emerald-500" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </form>
          <form action={softDeleteGame}>
            <input type="hidden" name="gameId" value={game.id} />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" type="submit">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  )
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchGames = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/steam/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.items ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    setMessage(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => searchGames(value), 300)
  }

  async function handleAdd(steamAppId: number) {
    setAdding(steamAppId)
    setMessage(null)
    const formData = new FormData()
    formData.set("steamAppId", String(steamAppId))
    const result = await addGameToLibrary(formData)
    setAdding(null)
    if (result?.error) {
      setMessage(result.error)
    } else {
      setMessage("Jeu ajouté avec succès")
      setTimeout(() => setMessage(null), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh]">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">Ajouter un jeu Steam</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un jeu sur Steam..."
              className="pl-8"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun résultat.</p>
          )}

          {!loading && query.length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tape au moins 2 caractères pour lancer la recherche.
            </p>
          )}

          {!loading && results.length > 0 && (
            <div className="divide-y">
              {results.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 px-2">
                  {item.tiny_image ? (
                    <img
                      src={`https://shared.steamstatic.com/store_item_assets/steam/apps/${item.id}/capsule_231x87.jpg`}
                      alt=""
                      className="h-10 w-auto rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-[60px] rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">App ID: {item.id}</p>
                  </div>

                  <a
                    href={`https://steamdb.info/app/${item.id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary shrink-0"
                    title="Ouvrir sur SteamDB"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => handleAdd(item.id)}
                    disabled={adding === item.id}
                  >
                    {adding === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Ajouter"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && (
          <div className="p-3 border-t text-sm text-center text-muted-foreground shrink-0">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

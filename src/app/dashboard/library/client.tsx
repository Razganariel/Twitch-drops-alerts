"use client"

import { useState } from "react"
import { Search, ExternalLink, Trash2, RotateCcw, Bell, BellOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toggleGameAlert, softDeleteGame, restoreGame, toggleAllAlerts } from "@/lib/actions/library"

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

export function LibraryClient({ games }: Props) {
  const [search, setSearch] = useState("")
  const [filterDeleted, setFilterDeleted] = useState(false)
  const [filterDemos, setFilterDemos] = useState(false)
  const [filterPlaytests, setFilterPlaytests] = useState(false)

  const allEnabled = games.filter((g) => !g.deletedAt).every((g) => g.isAlertEnabled) && games.filter((g) => !g.deletedAt).length > 0

  const shown = games.filter((g) => {
    const searchMatch = !search || g.name.toLowerCase().includes(search.toLowerCase())
    if (!searchMatch) return false

    const conditions: boolean[] = []
    if (filterDemos) conditions.push(g.name.toLowerCase().includes("demo"))
    if (filterPlaytests) conditions.push(g.name.toLowerCase().includes("playtest"))
    if (filterDeleted) conditions.push(!!g.deletedAt)

    if (conditions.length === 0) return !g.deletedAt
    return conditions.some(Boolean)
  })

  return (
    <div className="min-h-0 flex-1 flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-bold">Bibliothèque Steam</h1>
        <span className="text-sm text-muted-foreground">{games.length} jeux</span>
      </div>

      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un jeu..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filterDemos ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterDemos(!filterDemos)}
          >
            Démo
          </Button>
          <Button
            variant={filterPlaytests ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterPlaytests(!filterPlaytests)}
          >
            Playtest
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

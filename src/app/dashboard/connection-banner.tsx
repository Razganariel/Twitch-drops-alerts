"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle } from "lucide-react"

type Props = {
  twitchConnected: boolean
  gqlConnected: boolean
  steamConnected: boolean
  activeCampaigns: number
  syncedGames: number
  steamLastSyncedAt: string | null
  lastMatchAt: string | null
}

function SyncBadge({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function Elapsed({ at }: { at: string | null }) {
  const [label, setLabel] = useState("")
  useEffect(() => {
    const update = () => {
      if (!at) { setLabel("jamais"); return }
      const ago = Math.floor((Date.now() - new Date(at).getTime()) / 1000)
      setLabel(
        ago > 86400
          ? `${Math.floor(ago / 86400)}j`
          : ago > 3600
            ? `${Math.floor(ago / 3600)}h`
            : `${Math.floor(ago / 60)}min`
      )
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [at])
  return <span className="font-mono text-xs text-muted-foreground">{label}</span>
}

export function ConnectionBanner({
  twitchConnected,
  gqlConnected,
  steamConnected,
  activeCampaigns,
  syncedGames,
  steamLastSyncedAt,
  lastMatchAt,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <SyncBadge label="Twitch">
        {twitchConnected ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-label="Synchronisé" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" aria-label="Non synchronisé" />
        )}
      </SyncBadge>

      <SyncBadge label="Sync drops">
        {gqlConnected ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-label="Synchronisé" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" aria-label="Non synchronisé" />
        )}
      </SyncBadge>

      <SyncBadge label="Match drops">
        <Elapsed at={lastMatchAt} />
      </SyncBadge>

      <SyncBadge label="Campagnes">
        <span className="font-semibold">{activeCampaigns}</span>
      </SyncBadge>

      <SyncBadge label="Steam">
        {steamConnected ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-label="Synchronisé" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" aria-label="Non synchronisé" />
        )}
      </SyncBadge>

      <SyncBadge label="Sync Steam">
        <Elapsed at={steamLastSyncedAt} />
      </SyncBadge>

      <SyncBadge label="Jeux">
        <span className="font-semibold">{syncedGames}</span>
      </SyncBadge>
    </div>
  )
}

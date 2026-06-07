"use client"

import { useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"

type Props = {
  twitchConnected: boolean
  gqlConnected: boolean
  steamConnected: boolean
  activeCampaigns: number
  syncedGames: number
  steamLastSyncedAt: string | null
}

function SyncBadge({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function ConnectionBanner({
  twitchConnected,
  gqlConnected,
  steamConnected,
  activeCampaigns,
  syncedGames,
  steamLastSyncedAt,
}: Props) {
  const [{ steamSyncLabel }] = useState(() => {
    const now = Date.now()

    const steamSyncAgo = steamLastSyncedAt
      ? Math.floor((now - new Date(steamLastSyncedAt).getTime()) / 1000)
      : null

    const stl = steamSyncAgo !== null
      ? steamSyncAgo > 86400
        ? `${Math.floor(steamSyncAgo / 86400)}j`
        : steamSyncAgo > 3600
          ? `${Math.floor(steamSyncAgo / 3600)}h`
          : `${Math.floor(steamSyncAgo / 60)}min`
      : "jamais"

    return { steamSyncLabel: stl }
  })

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
        <span className="font-mono text-xs text-muted-foreground">{steamSyncLabel}</span>
      </SyncBadge>

      <SyncBadge label="Jeux">
        <span className="font-semibold">{syncedGames}</span>
      </SyncBadge>
    </div>
  )
}

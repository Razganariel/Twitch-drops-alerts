"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, BellRing, Mail, MailCheck, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CampaignProgress } from "@/components/shared/campaign-progress"
import { markAlertAsRead } from "@/lib/actions/alerts"

type AlertInfo = {
  id: string
  status: string
} | null

type DropItem = {
  id: string
  name: string
  rewardName: string | null
  rewardImageUrl: string | null
  requiredMinutesWatched: number | null
}

type Campaign = {
  id: string
  campaignId: string
  gameName: string
  gameBoxArtUrl: string | null
  campaignName: string
  startAt: string
  endAt: string
  dropItems: DropItem[]
  alert: AlertInfo
}

type Props = {
  campaign: Campaign
}

export function CampaignRow({ campaign }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [localAlert, setLocalAlert] = useState(campaign.alert)

  useEffect(() => {
    setLocalAlert(campaign.alert)
  }, [campaign.alert])

  async function handleMarkRead(alertId: string) {
    await markAlertAsRead(alertId)
    setLocalAlert({ id: alertId, status: "READ" })
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-3 p-3">
        {campaign.gameBoxArtUrl ? (
          <img
            src={campaign.gameBoxArtUrl.replace("{width}x{height}", "40x52")}
            alt=""
            className="h-10 w-8 rounded object-cover shrink-0"
          />
        ) : (
          <div className="h-10 w-8 rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
            N/A
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{campaign.gameName}</p>
          <p className="text-xs text-muted-foreground truncate">{campaign.campaignName}</p>
        </div>

        <Badge variant="outline" className="text-xs shrink-0">
          {campaign.dropItems.length}
        </Badge>

        <CampaignProgress startAt={campaign.startAt} endAt={campaign.endAt} />

        <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline whitespace-nowrap">
          <Clock className="h-3 w-3 inline mr-1" />
          {new Date(campaign.startAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          {" → "}
          {new Date(campaign.endAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {localAlert ? (
            localAlert.status === "SENT" ? (
              <button
                type="button"
                onClick={() => handleMarkRead(localAlert.id)}
                className="text-amber-500 hover:text-amber-600 transition-colors"
                aria-label="Alerte non lue — cliquer pour marquer comme lue"
              >
                <BellRing className="h-4 w-4" />
              </button>
            ) : (
              <Bell className="h-4 w-4 text-emerald-500" aria-label="Alerte lue" />
            )
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground/40" aria-label="Pas d'alerte" />
          )}

          {localAlert ? (
            <MailCheck className="h-3.5 w-3.5 text-emerald-500" aria-label="Email envoyé" />
          ) : (
            <Mail className="h-3.5 w-3.5 text-muted-foreground/40" aria-label="Aucun email" />
          )}

          {campaign.dropItems.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {expanded && campaign.dropItems.length > 0 && (
        <div className="border-t px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2 text-sm pl-11 text-muted-foreground sm:hidden">
            <Clock className="h-3 w-3 shrink-0" />
            {new Date(campaign.startAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            {" → "}
            {new Date(campaign.endAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </div>
          {campaign.dropItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm pl-11">
              {item.rewardImageUrl ? (
                <img src={item.rewardImageUrl} alt="" className="h-6 w-6 rounded object-cover" />
              ) : (
                <div className="h-6 w-6 rounded bg-muted shrink-0" />
              )}
              <span className="flex-1 truncate">{item.rewardName ?? item.name}</span>
              {item.requiredMinutesWatched && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.requiredMinutesWatched} min
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

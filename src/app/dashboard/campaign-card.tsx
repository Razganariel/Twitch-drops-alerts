"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, BellRing, Mail, MailCheck, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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

export function CampaignCard({ campaign }: Props) {
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
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {campaign.gameBoxArtUrl ? (
            <img
              src={campaign.gameBoxArtUrl.replace("{width}x{height}", "80x106")}
              alt=""
              className="h-20 w-15 rounded object-cover shrink-0"
            />
          ) : (
            <div className="h-20 w-15 rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
              N/A
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{campaign.gameName}</p>
            <p className="text-sm text-muted-foreground truncate">{campaign.campaignName}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {campaign.dropItems.length} drop{campaign.dropItems.length > 1 ? "s" : ""}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(campaign.startAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 shrink-0">
            {localAlert ? (
              localAlert.status === "SENT" ? (
                <button
                  type="button"
                  onClick={() => handleMarkRead(localAlert.id)}
                  className="text-amber-500 hover:text-amber-600 transition-colors"
                  aria-label="Alerte non lue — cliquer pour marquer comme lue"
                >
                  <BellRing className="h-5 w-5" />
                </button>
              ) : (
                <Bell className="h-5 w-5 text-emerald-500" aria-label="Alerte lue" />
              )
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground/40" aria-label="Pas d'alerte" />
            )}

            {localAlert ? (
              <MailCheck className="h-4 w-4 text-emerald-500" aria-label="Email envoyé" />
            ) : (
              <Mail className="h-4 w-4 text-muted-foreground/40" aria-label="Aucun email" />
            )}
          </div>
        </div>

        <CampaignProgress startAt={campaign.startAt} endAt={campaign.endAt} variant="card" />

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {new Date(campaign.startAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "short",
            })}{" "}
            →{" "}
            {new Date(campaign.endAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
        </div>

        {campaign.dropItems.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3 mr-1" /> Masquer les drops</>
              ) : (
                <><ChevronDown className="h-3 w-3 mr-1" /> Voir les drops</>
              )}
            </Button>

            {expanded && (
              <div className="space-y-2 border-t pt-2">
                {campaign.dropItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    {item.rewardImageUrl ? (
                      <img src={item.rewardImageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{item.rewardName ?? item.name}</p>
                      {item.requiredMinutesWatched && (
                        <p className="text-xs text-muted-foreground">
                          {item.requiredMinutesWatched} min regardées
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

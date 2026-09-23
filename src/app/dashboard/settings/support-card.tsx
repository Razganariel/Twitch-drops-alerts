import { Coffee } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KOFI_URL } from "@/lib/utils"

export function SupportCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Soutenir le projet
        </CardTitle>
        <CardDescription>
          L&apos;outil est gratuit et sans publicité. Si tu apprécies Twitch
          Drops Alerts, un café sur Ko-fi aide à financer son maintien.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <a href={KOFI_URL} target="_blank" rel="noopener noreferrer">
            <Coffee className="h-4 w-4" />
            Me soutenir sur Ko-fi
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
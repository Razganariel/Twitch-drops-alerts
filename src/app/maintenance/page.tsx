import Link from "next/link"

export default function MaintenancePage() {
  return (
    <div className="flex flex-col min-h-svh">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/TwitchDropsSteam.png"
              alt="Twitch Drops Alerts"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-xl font-bold tracking-tight hidden sm:inline">
              Twitch Drops Alerts
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-8 text-center max-w-md">
          <img
            src="/baniere-maintenance.png"
            alt="Maintenance"
            className="rounded-lg border shadow-xl w-full h-auto"
          />
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Maintenance en cours
            </h1>
            <p className="text-lg text-muted-foreground">
              L&apos;application est temporairement en maintenance
              pour des améliorations. Veuillez réessayer plus tard.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Twitch Drops Alerts. Sous licence{" "}
            <Link
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              AGPL-3
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}

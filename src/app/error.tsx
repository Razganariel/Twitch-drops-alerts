"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Erreur</h1>
          <p className="text-muted-foreground">
            Une erreur inattendue s&apos;est produite.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}

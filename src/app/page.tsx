import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 px-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Twitch Drops Alert
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Ne ratez plus aucun drop Twitch. Connectez vos comptes Twitch et
          Steam, et recevez une alerte quand un drop correspond à votre
          bibliothèque de jeux.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Créer un compte
          </Link>
        </div>
      </main>
    </div>
  )
}

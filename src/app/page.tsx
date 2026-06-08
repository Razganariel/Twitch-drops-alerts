import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Gamepad2,
  Bell,
  Zap,
  Shield,
  Mail,
  ArrowRight,
  ExternalLink,
  Repeat2,
} from "lucide-react"

export function generateMetadata(): Metadata {
  return {
    title: "Accueil",
    description:
      "Ne ratez plus aucun drop Twitch. Connectez vos comptes Twitch et Steam, et recevez une alerte personnalisée quand un drop correspond à votre bibliothèque de jeux.",
    openGraph: {
      title: "Twitch Drops Alerts",
      description:
        "Ne ratez plus aucun drop Twitch. Connectez vos comptes Twitch et Steam, et recevez une alerte personnalisée quand un drop correspond à votre bibliothèque de jeux.",
    },
  }
}

export default async function Home() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div className="flex flex-col min-h-svh">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <Image
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
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center px-6 py-24 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Ne ratez plus aucun drop Twitch
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Connectez vos comptes Twitch et Steam, et recevez une alerte
            personnalisée quand un drop correspond à votre bibliothèque de jeux.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 h-12 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Commencer
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-16 w-full max-w-4xl">
            <Image
              src="/baniere.png"
              alt="Aperçu de l'application"
              width={1584}
              height={672}
              className="rounded-lg border shadow-xl w-full h-auto"
              priority
            />
          </div>
        </section>

        <section className="border-t py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Comment ça marche
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
              Trois étapes simples pour ne plus jamais manquer un drop.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-5">
                  <Gamepad2 className="h-7 w-7 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    1
                  </span>
                  <h3 className="font-semibold text-lg">Connectez vos comptes</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Liez vos comptes Twitch et Steam en quelques clics. Nous
                  accédons uniquement aux informations nécessaires.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-5">
                  <Repeat2 className="h-7 w-7 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    2
                  </span>
                  <h3 className="font-semibold text-lg">Matching automatique</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Notre moteur compare les drops actifs avec votre bibliothèque
                  Steam et identifie ceux qui vous intéressent.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-5">
                  <Bell className="h-7 w-7 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    3
                  </span>
                  <h3 className="font-semibold text-lg">Alertes email</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recevez une notification par email dès qu&apos;un nouveau drop
                  correspond à vos jeux. Ne manquez aucune récompense.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t py-16 md:py-24 px-6 bg-muted/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Fonctionnalités
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
              Tout ce dont vous avez besoin pour suivre vos drops Twitch.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Zap}
                title="Synchro automatique"
                description="Vos drops et votre bibliothèque Steam sont synchronisés régulièrement sans action de votre part."
              />
              <FeatureCard
                icon={Bell}
                title="Alertes personnalisées"
                description="Choisissez les jeux pour lesquels vous voulez être averti. Gérez vos préférences depuis votre tableau de bord."
              />
              <FeatureCard
                icon={Mail}
                title="Email prioritaire"
                description="Alertes par email via Resend ou SMTP. Support multi-fournisseur pour une livraison fiable."
              />
              <FeatureCard
                icon={Shield}
                title="Respect de la vie privée"
                description="Nous ne stockons que les données nécessaires au matching. Vous pouvez tout supprimer à tout moment."
              />
              <FeatureCard
                icon={Repeat2}
                title="Matching intelligent"
                description="Comparaison insensible à la casse pour maximiser les correspondances entre drops et votre bibliothèque."
              />
              <FeatureCard
                icon={Gamepad2}
                title="Bibliothèque complète"
                description="Visualisez votre bibliothèque Steam directement dans l'application. Activez ou désactivez les alertes jeu par jeu."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Twitch Drops Alerts.             Sous licence{" "}
            <Link
              href="https://www.gnu.org/licenses/gpl-3.0.html"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              GPL-3
            </Link>
            .
          </p>
          <Link
            href="https://github.com/dvergar/Twitch-drops-alerts"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

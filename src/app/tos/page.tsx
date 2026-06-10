import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  FileText,
  Settings,
  ShieldAlert,
  UserCheck,
  Copyright,
  Ban,
  Trash2,
  Mail,
  ExternalLink,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions Générales d'Utilisation de Twitch Drops Alerts — droits et obligations des utilisateurs du service.",
}

export default function TosPage() {
  return (
    <div className="flex flex-col min-h-svh">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6 max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 md:py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Conditions Générales d&apos;Utilisation
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : juin 2026
            </p>
          </div>

          <Section icon={FileText} title="Objet">
            <p>
              Twitch Drops Alerts est un service en ligne permettant aux
              utilisateurs de connecter leurs comptes Twitch et Steam afin de
              recevoir des alertes par email lorsqu&apos;un drop Twitch
              correspond à leur bibliothèque de jeux Steam.
            </p>
            <p>
              Les présentes CGU régissent l&apos;utilisation du service.
              En créant un compte, vous acceptez l&apos;intégralité des
              conditions décrites ci-dessous.
            </p>
          </Section>

          <Section icon={Settings} title="Fonctionnement">
            <p>Le service repose sur les fonctionnalités suivantes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Connexion Twitch OAuth</strong> — pour synchroniser les
                drops actifs et les chaînes suivies.
              </li>
              <li>
                <strong>API Steam</strong> — pour récupérer la bibliothèque de
                jeux de l&apos;utilisateur et détecter les correspondances.
              </li>
              <li>
                <strong>Matching automatique</strong> — comparaison entre les
                drops Twitch actifs et la bibliothèque Steam.
              </li>
              <li>
                <strong>Alertes email</strong> — notification lorsqu&apos;un
                drop correspond à un jeu possédé.
              </li>
            </ul>
          </Section>

          <Section icon={ShieldAlert} title="Responsabilités">
            <p>
              Le service est fourni &quot;tel quel&quot;, sans garantie
              expresse ou implicite de détection de l&apos;intégralité des
              drops Twitch. Des drops peuvent ne pas être détectés en raison
              de limitations techniques des API utilisées.
            </p>
            <p>
              L&apos;utilisateur est seul responsable de la validité et de la
              confidentialité de ses tokens d&apos;accès et clés API.
            </p>
            <p>
              L&apos;éditeur du service ne pourra être tenu responsable si
              Twitch ou Steam venaient à modifier, limiter ou interrompre
              leurs API, rendant tout ou partie du service indisponible.
            </p>
          </Section>

          <Section icon={UserCheck} title="Données personnelles">
            <p>
              La politique de confidentialité décrit l&apos;ensemble des
              données collectées, leur finalité, et les droits des
              utilisateurs. Elle fait partie intégrante des présentes CGU.
            </p>
            <p>
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Voir la politique de confidentialité
              </Link>
            </p>
          </Section>

          <Section icon={Copyright} title="Propriété intellectuelle">
            <p>
              Le code source de Twitch Drops Alerts est publié sous licence
              AGPL-3. Vous pouvez le consulter, le modifier et le distribuer
              selon les termes de cette licence.
            </p>
            <p>
              Les marques &quot;Twitch&quot;, &quot;Steam&quot; et leurs logos
              respectifs sont la propriété de leurs détenteurs légitimes.
              Twitch Drops Alerts n&apos;est pas affilié, approuvé ou
              sponsorisé par Twitch, Amazon, Steam ou Valve Corporation.
            </p>
          </Section>

          <Section icon={Ban} title="Utilisation acceptable">
            <p>En utilisant le service, vous vous engagez à :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Ne pas utiliser le service pour du scraping abusif des
                données Twitch ou Steam.
              </li>
              <li>
                Ne pas contourner les limites techniques mises en place
                (rate limiting, quotas).
              </li>
              <li>
                Ne pas créer plusieurs comptes pour une même personne
                physique.
              </li>
              <li>
                Ne pas utiliser le service à des fins illicites ou
                frauduleuses.
              </li>
            </ul>
          </Section>

          <Section icon={Trash2} title="Suppression de compte">
            <p>
              Vous pouvez à tout moment supprimer votre compte et toutes les
              données associées depuis la page des paramètres. La suppression
              est définitive et irréversible.
            </p>
            <p>
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                En savoir plus sur la suppression des données
              </Link>
            </p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez
              nous contacter à :
            </p>
            <p className="font-medium">
              twitchdropsalerts@free.fr
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Twitch Drops Alerts.{" "}
            Sous licence{" "}
            <Link
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              AGPL-3
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

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="text-muted-foreground space-y-3 leading-relaxed ml-[3.25rem]">
        {children}
      </div>
    </section>
  )
}

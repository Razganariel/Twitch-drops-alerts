import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Shield, Database, EyeOff, Mail, Trash2, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Confidentialité",
  description:
    "Politique de confidentialité de Twitch Drops Alerts — quelles données sont collectées, pourquoi, et comment les supprimer.",
}

export default function PrivacyPage() {
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
              Politique de confidentialité
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : juin 2026
            </p>
          </div>

          <Section
            icon={Database}
            title="Données collectées"
          >
            <p>
              Twitch Drops Alerts collecte uniquement les données nécessaires
              au fonctionnement du service :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Adresse email</strong> — utilisée pour la connexion au
                compte et l&apos;envoi des alertes lorsqu&apos;un drop
                correspond à votre bibliothèque Steam.
              </li>
              <li>
                <strong>Identifiant Twitch</strong> — utilisé pour synchroniser
                vos drops actifs et vos chaînes suivies.
              </li>
              <li>
                <strong>Identifiant Steam et clé API</strong> — utilisés pour
                récupérer votre bibliothèque de jeux et faire correspondre les
                drops. Le site ne peut que lire votre bibliothèque, aucune
                autre action (achat, échange, modification de profil) n&apos;est
                possible.
              </li>
              <li>
                <strong>Bibliothèque de jeux Steam</strong> — utilisée
                uniquement pour le matching avec les drops Twitch. Seuls les
                jeux que vous possédez sont comparés, aucune liste n&apos;est
                publiée.
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Toutes ces données sont stockées de manière sécurisée
              et accessibles uniquement par vous et le service.
            </p>
          </Section>

          <Section
            icon={EyeOff}
            title="Finalité des données"
          >
            <p>
              Chaque donnée collectée sert exclusivement à la fonctionnalité
              pour laquelle elle a été fournie :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>L&apos;email sert à vous connecter et à vous envoyer des alertes.</li>
              <li>Les identifiants Twitch servent à synchroniser vos drops.</li>
              <li>
                La clé API Steam et votre bibliothèque servent à détecter les
                correspondances avec les drops actifs.
              </li>
            </ul>
            <p>
              Aucune donnée n&apos;est utilisée à d&apos;autres fins que celles
              décrites ci-dessus.
            </p>
          </Section>

          <Section
            icon={Shield}
            title="Aucun partenariat"
          >
            <p>
              Twitch Drops Alerts est un projet indépendant et open source. Il
              n&apos;est pas affilié, approuvé, ou sponsorisé par Twitch,
              Amazon, Steam, ou Valve Corporation.
            </p>
            <p>
              Les marques &quot;Twitch&quot;, &quot;Steam&quot; et leurs logos
              respectifs appartiennent à leurs propriétaires légitimes.
            </p>
          </Section>

          <Section
            icon={Mail}
            title="Aucune revente de données"
          >
            <p>
              Vos données personnelles ne sont en aucun cas revendues,
              partagées, louées ou exploitées à des fins commerciales. Le
              service est financé par son créateur et non par la
              monétisation des données utilisateurs.
            </p>
            <p>
              Ce projet est open source sous licence GPL-3. Vous pouvez
              consulter le code source, vérifier ce que fait l&apos;application,
              et même l&apos;exécuter sur votre propre serveur si vous le
              souhaitez.
            </p>
          </Section>

          <Section
            icon={Trash2}
            title="Suppression sur demande"
          >
            <p>
              Vous pouvez à tout moment demander la suppression de votre
              compte et de toutes les données associées :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Depuis votre tableau de bord</strong> — une option de
                suppression de compte sera disponible dans les paramètres.
              </li>
              <li>
                <strong>Par email</strong> — envoyez une demande à l&apos;adresse
                ci-dessous. Nous traiterons votre demande sous 7 jours ouvrés.
              </li>
            </ul>
            <p>
              La suppression entraîne l&apos;effacement définitif de votre
              compte, de vos connexions Twitch et Steam, de votre bibliothèque
              importée, et de l&apos;historique de vos alertes. Cette action
              est irréversible.
            </p>
          </Section>

          <Section
            icon={Mail}
            title="Contact"
          >
            <p>
              Pour toute question relative à la protection des données, vous
              pouvez nous contacter à :
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

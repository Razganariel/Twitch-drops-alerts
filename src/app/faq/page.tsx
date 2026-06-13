import type { Metadata } from "next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "FAQ",
}

const faqItems = [
  {
    value: "quest-ce-que",
    question: "Qu'est-ce que Twitch Drops Alerts ?",
    answer:
      "Twitch Drops Alerts est un outil qui connecte vos comptes Twitch et Steam pour vous alerter par email quand un drop Twitch actif correspond à un jeu de votre bibliothèque Steam. Plus besoin de surveiller manuellement les drops — vous recevez une notification dès qu'une récompense vous concerne.",
  },
  {
    value: "connecter-twitch",
    question: "Comment connecter mon compte Twitch ?",
    answer:
      "Rendez-vous dans la page Connexions de votre tableau de bord. Cliquez sur « Connecter Twitch » et autorisez l'application via la fenêtre OAuth qui s'ouvre. Seuls les accès nécessaires (email, liste de suivi) sont demandés. Vous pouvez déconnecter votre compte à tout moment.",
  },
  {
    value: "connecter-steam",
    question: "Comment connecter mon compte Steam ?",
    answer:
      "Dans la page Connexions, cliquez sur « Connecter Steam ». Vous aurez besoin de votre Steam ID (visible sur votre profil Steam) et d'une clé API Steam à créer sur https://steamcommunity.com/dev/apikey. Une fois renseignés, votre bibliothèque Steam sera synchronisée. Notez que certains jeux peuvent ne pas apparaître en raison de limitations du côté de Steam.",
  },
  {
    value: "matching",
    question: "Comment fonctionne le matching ?",
    answer:
      "Le matching compare les noms des jeux associés aux drops Twitch actifs avec les noms des jeux de votre bibliothèque Steam. La comparaison est insensible à la casse pour maximiser les correspondances. Les jeux dont le nom contient « demo » ou « playtest » sont automatiquement filtrés lors de la synchronisation.",
  },
  {
    value: "synchronisation-bibliotheque",
    question: "Comment fonctionne la synchronisation de la bibliothèque ?",
    answer:
      "Lorsque vous connectez votre compte Steam, votre bibliothèque est importée via l'API Steam GetOwnedGames. Cette opération récupère la liste des jeux que vous possédez et les associe aux drops Twitch. Si un jeu est retiré de votre bibliothèque Steam, il est automatiquement supprimé de notre base. Vous pouvez également ajouter un jeu manuellement depuis la page Bibliothèque si celui-ci n'est pas détecté automatiquement. La synchronisation est planifiée pour s'exécuter régulièrement, garantissant que votre liste est toujours à jour.",
  },
  {
    value: "frequence",
    question: "À quelle fréquence les drops sont-ils vérifiés ?",
    answer:
      "Les drops Twitch sont vérifiés régulièrement par un service de synchronisation automatisé. Vous pouvez également lancer une synchronisation manuelle depuis la page Alertes de votre tableau de bord. Un compte de service Twitch dédié est utilisé pour garantir la fiabilité des vérifications.",
  },
  {
    value: "alertes",
    question: "Comment sont envoyées les alertes ?",
    answer:
      "Les alertes sont envoyées par email via Resend ou un serveur SMTP selon la configuration de l'application. L'email contient le nom du jeu, la campagne de drop concernée, et un rappel de vos préférences d'alertes. Vous pouvez gérer les alertes jeu par jeu depuis votre bibliothèque.",
  },
  {
    value: "jeu-non-detecte",
    question: "Que faire si un jeu n'est pas détecté ?",
    answer:
      "L'API Steam GetOwnedGames ne retourne pas l'intégralité des jeux possédés (certains jeux gratuits, démos ou jeux retirés du catalogue peuvent être absents). Vous pouvez ajouter manuellement un jeu depuis la page Bibliothèque en recherchant son nom. Si le jeu est bien dans votre bibliothèque Steam mais absent de la liste, une resynchronisation peut résoudre le problème.",
  },
  {
    value: "donnees-securisees",
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Oui. Les données sensibles (email, nom, identifiants Steam et Twitch, nom des jeux de votre bibliothèque) sont chiffrées en base de données. Les tokens d'accès sont également chiffrés. Les mots de passe sont hashés. Vous pouvez à tout moment télécharger vos données ou supprimer votre compte depuis la page Paramètres.",
  },
  {
    value: "depannage",
    question: "Dépannage",
    answer:
      "Si la synchronisation ne fonctionne pas : vérifiez que votre clé API Steam est valide et que votre compte Twitch est bien connecté. Si les alertes ne sont pas reçues : vérifiez vos préférences d'alertes dans la page Alertes et que votre adresse email est correcte. Pour tout problème persistant, contactez l'administrateur.",
  },
]

export default function FaqPage() {
  return (
    <div className="space-y-8 max-w-3xl w-full mx-auto py-6">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Foire aux questions</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Tout ce que vous devez savoir sur Twitch Drops Alerts
        </p>
      </div>

      <Accordion type="multiple" className="w-full space-y-4">
        {faqItems.map((item) => (
          <AccordionItem key={item.value} value={item.value} className="w-full rounded-lg border px-5">
            <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground pb-5 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

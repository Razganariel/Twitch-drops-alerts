# Twitch Drops Alert

Twitch Drops Alert est un outil web qui permet aux utilisateurs de connecter leur compte Twitch (via OAuth) et leur compte Steam (via clé API) afin de surveiller les drops actifs sur Twitch et de les comparer avec leur bibliothèque Steam. Lorsqu'un jeu possédé par l'utilisateur propose un drop actif sur Twitch, une alerte email est automatiquement envoyée.

Le système gère plusieurs utilisateurs avec un système de comptes, une file d'attente de tâches Redis/BullMQ pour les vérifications périodiques, et une interface moderne et responsive.

---

## Stack technique

| Technologie | Rôle |
|---|---|
| **Next.js 14+** (App Router) | Framework frontend & backend (API routes, Server Actions) |
| **React 18+** | Bibliothèque UI |
| **TypeScript** | Typage strict |
| **Tailwind CSS** | Styles utilitaires |
| **shadcn/ui** | Composants UI réutilisables |
| **PostgreSQL** | Base de données relationnelle |
| **Prisma** | ORM et migrations |
| **NextAuth.js** | Authentification OAuth (Twitch, credentials) |
| **Resend / Nodemailer** | Envoi d'emails transactionnels |
| **BullMQ + Redis** | File d'attente de tâches et cache |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Client Browser                      │
│           Next.js App Router (RSC / RCC)             │
├─────────────────────────────────────────────────────┤
│              Server Actions (mutations)               │
│              API Routes (webhooks, auth)              │
├───────────────────┬─────────────────────────────────┤
│   Prisma ORM      │       BullMQ Worker              │
│   PostgreSQL      │       Redis                      │
├───────────────────┴─────────────────────────────────┤
│       Twitch API (OAuth + Helix)                     │
│       Steam API (ISteamUser, ISteamApps)              │
│       Resend / SMTP                                   │
└─────────────────────────────────────────────────────┘
```

- **Server Components** par défaut pour le rendu côté serveur
- **Client Components** uniquement là où l'interactivité est nécessaire
- **API Routes** pour les appels externes (Twitch, Steam)
- **Server Actions** pour les mutations (connexions, paramètres)
- **BullMQ** pour les tâches planifiées de vérification des drops

---

## Fonctionnalités

### Gestion des comptes
- Inscription et connexion (email + mot de passe)
- Connexion via Twitch OAuth (obtention du token d'accès)
- Ajout d'une clé API Steam
- Modification du profil et préférences de notification

### Intégrations
- Synchronisation de la bibliothèque Steam (liste des jeux possédés)
- Récupération des drops actifs via l'API Twitch Helix
- Rafraîchissement automatique des tokens Twitch

### Matching et alertes
- Algorithme de comparaison entre les drops Twitch et la bibliothèque Steam
- Détection des nouveaux drops (non encore notifiés)
- Envoi d'email avec le nom du jeu, la date de fin du drop, et le lien Twitch
- Planification via BullMQ (vérification toutes les X minutes)

### Interface
- Dashboard récapitulatif (drops actifs, matchs trouvés, historique)
- Page de connexion des comptes Twitch et Steam
- Historique des alertes envoyées
- Mode sombre / clair
- Design responsive (mobile, tablette, desktop)

---

## Prérequis

- **Node.js 18+**
- **PostgreSQL** (14+ recommandé)
- **Redis** (7+ recommandé)
- Un compte Twitch Developer (pour l'OAuth)
- Un compte Steam (pour la clé API)
- Un compte Resend ou un serveur SMTP

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/dvergar/twitch-drops-alerts.git
cd twitch-drops-alerts

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement
cp .env.example .env.local

# 4. Configurer les variables d'environnement
#    Éditer .env.local avec vos clés Twitch, Steam, etc.

# 5. Initialiser la base de données
npx prisma generate
npx prisma db push

# 6. Démarrer le serveur de développement
npm run dev
```

### Variables d'environnement (.env.local)

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/twitch-drops-alerts"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret"

# Twitch OAuth
TWITCH_CLIENT_ID="votre-client-id"
TWITCH_CLIENT_SECRET="votre-client-secret"

# Resend (emails)
RESEND_API_KEY="votre-cle-resend"
EMAIL_FROM="alerts@votre-domaine.com"

# Redis (BullMQ)
REDIS_URL="redis://localhost:6379"

# Steam API
STEAM_API_KEY="votre-cle-steam"
```

---

## Structure du projet

```
twitch-drops-alerts/
├── prisma/
│   ├── schema.prisma          # Schéma de la base de données
│   └── migrations/            # Migrations Prisma
├── public/                    # Fichiers statiques
├── src/
│   ├── app/                   # App Router
│   │   ├── (auth)/            # Pages d'authentification
│   │   ├── dashboard/         # Dashboard utilisateur
│   │   ├── api/               # API Routes
│   │   ├── layout.tsx         # Layout racine
│   │   └── page.tsx           # Page d'accueil
│   ├── components/            # Composants React
│   │   ├── ui/                # shadcn/ui components
│   │   └── shared/            # Composants métier
│   ├── lib/                   # Utilitaires et configurations
│   │   ├── auth.ts            # Configuration NextAuth
│   │   ├── prisma.ts          # Client Prisma
│   │   ├── redis.ts           # Connexion Redis
│   │   └── queue.ts           # Configuration BullMQ
│   ├── services/              # Services métier
│   │   ├── twitch.ts          # Appels API Twitch
│   │   ├── steam.ts           # Appels API Steam
│   │   ├── matcher.ts         # Algorithme de matching
│   │   └── email.ts           # Envoi d'emails
│   └── workers/               # BullMQ workers
│       ├── drop-check.ts      # Vérification des drops
│       └── email-sender.ts    # Envoi d'emails
├── dev/                       # Prompts et documentation développeur
├── docker-compose.yml         # Stack locale (PostgreSQL + Redis)
├── .env.example               # Exemple de variables d'environnement
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Licence

Ce projet est sous licence GNU GPL v3. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

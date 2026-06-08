# Twitch Drops Alerts

Application multi-utilisateurs connectant Twitch (OAuth) et Steam (API key) pour détecter les drops Twitch correspondant à la bibliothèque Steam de l'utilisateur et envoyer des alertes par email.

## Stack

- **Frontend :** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui
- **Backend :** NextAuth v5 (Credentials + Twitch, JWT), Prisma 7
- **Base de données :** PostgreSQL 16
- **File d'attente :** BullMQ + Redis 7

## Installation (tout-en-un avec Podman/Docker Compose)

### 1. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditez `.env` et remplacez toutes les valeurs `PLACE_HOLDER` par vos propres identifiants.

### 2. Configurer la base de données

Dans `docker-compose.yml`, remplacez les `PLACE_HOLDER` de la section `postgres.environment` par les mêmes identifiants que dans `.env`.

### 3. Lancer l'infrastructure

```bash
# Avec Docker
docker compose up -d --build

# Avec Podman
podman compose up -d --build
```

Cela démarre 4 conteneurs :
- `twitch-drops-postgres` — base de données PostgreSQL
- `twitch-drops-redis` — Redis pour BullMQ
- `twitch-drops-alerts` — application Next.js (port 3330)
- `twitch-drops-worker` — worker BullMQ (tâches planifiées + emails)

### 4. Initialiser la base de données

```bash
npm run db:setup
```

### 5. Accéder à l'application

Ouvrez http://localhost:3330

### Développement local

```bash
# Lancer PostgreSQL et Redis
podman compose up -d postgres redis

# Installer les dépendances
npm install

# Initialiser la base de données
npm run db:setup

# Lancer le serveur de développement + worker (dans deux terminaux)
npm run dev
npm run worker
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `AUTH_SECRET` | Clé secrète NextAuth (générer avec `openssl rand -base64 32`) |
| `AUTH_URL` | URL publique de l'application |
| `TWITCH_CLIENT_ID` | Client ID Twitch (console développeur) |
| `TWITCH_CLIENT_SECRET` | Client Secret Twitch |
| `STEAM_API_KEY` | Clé API Steam |
| `REDIS_URL` | URL de connexion Redis |
| `RESEND_API_KEY` | Clé API Resend (optionnel, SMTP utilisé si vide) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Configuration SMTP (fallback) |
| `EMAIL_FROM` | Adresse d'expédition des emails |

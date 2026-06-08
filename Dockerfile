FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN rm -f .env prisma/.env .next/standalone/.env
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS app-runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3330

CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --url \"$DATABASE_URL\" && node server.js"]

FROM node:22-alpine AS worker-runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

CMD ["npx", "tsx", "src/worker.ts"]

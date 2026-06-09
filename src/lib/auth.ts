import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Twitch from "next-auth/providers/twitch"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { encrypt, decrypt, hashValue } from "@/lib/encryption"

async function migrateUser(userId: string, email: string, name: string | null) {
  const emailHash = hashValue(email)
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name ? encrypt(name) : null,
      email: encrypt(email),
      emailHash,
    },
  })
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
  }
}

type TwitchProfile = {
  sub?: string
  preferred_username?: string
  data?: Array<{ id: string; login: string; display_name: string; email?: string; profile_image_url?: string }>
}

const baseAdapter = PrismaAdapter(prisma)

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: {
    ...baseAdapter,
    async createUser(userData) {
      const emailHash = userData.email ? hashValue(userData.email) : null
      const created = await prisma.user.create({
        data: {
          ...userData,
          name: userData.name ? encrypt(userData.name) : null,
          email: userData.email ? encrypt(userData.email) : null,
          emailHash,
        },
      })
      return {
        ...created,
        email: userData.email,
        name: userData.name,
      } as any
    },
    async getUserByEmail(email) {
      const emailHash = hashValue(email)
      const user = await prisma.user.findUnique({ where: { emailHash } })
      if (user) return user as any
      return prisma.user.findUnique({ where: { email } }) as any
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string
          password: string
        }

        const emailHash = hashValue(email)
        const user = await prisma.user.findUnique({ where: { emailHash } })

        if (user) {
          if (!user.password) return null
          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) return null
          return {
            id: user.id,
            email: user.email ? decrypt(user.email) : null,
            name: user.name ? decrypt(user.name) : null,
            image: user.image,
          }
        }

        const legacyUser = await prisma.user.findUnique({ where: { email } })
        if (!legacyUser || !legacyUser.password) return null
        const isValidLegacy = await bcrypt.compare(password, legacyUser.password)
        if (!isValidLegacy) return null
        const plainEmail = legacyUser.email!
        const plainName = legacyUser.name
        await migrateUser(legacyUser.id, plainEmail, plainName)
        return {
          id: legacyUser.id,
          email: plainEmail,
          name: plainName,
          image: legacyUser.image,
        }
      },
    }),
    Twitch({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      checks: [],
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid user:read:email user:read:follows",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id!
      }
      if (account?.provider === "twitch" && user && profile) {
        const p = profile as TwitchProfile
        const twitchLogin = p.preferred_username ?? p.data?.[0]?.login ?? ""
        await prisma.twitchConnection.upsert({
          where: { userId: user.id as string },
          update: {
            twitchId: account.providerAccountId,
            twitchLogin,
            accessToken: account.access_token ?? undefined,
            refreshToken: account.refresh_token ?? undefined,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
          },
          create: {
            userId: user.id as string,
            twitchId: account.providerAccountId,
            twitchLogin,
            accessToken: account.access_token ?? undefined,
            refreshToken: account.refresh_token ?? undefined,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
          },
        })
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
      }
      return session
    },
  },
})

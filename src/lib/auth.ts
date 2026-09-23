import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Twitch from "next-auth/providers/twitch"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { encrypt, decrypt, safeDecrypt, hashValue } from "@/lib/encryption"
import { loginSchema } from "@/lib/schemas/auth"
import { checkRateLimit } from "@/lib/rate-limit"

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
      if (!user) return null as any
      return {
        ...user,
        email: decrypt(user.email!),
        name: user.name ? decrypt(user.name) : null,
      } as any
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      })
      if (!account) return null as any
      const user = account.user
      return {
        ...user,
        email: user.email ? safeDecrypt(user.email) : null,
        name: user.name ? safeDecrypt(user.name) : null,
      } as any
    },
    async updateUser(userData) {
      const data: Record<string, unknown> = { ...userData }
      delete data.id
      if (data.email) {
        data.emailHash = hashValue(data.email as string)
        data.email = encrypt(data.email as string)
      }
      if (data.name) data.name = encrypt(data.name as string)
      const updated = await prisma.user.update({
        where: { id: userData.id },
        data,
      })
      return {
        ...updated,
        email: decrypt(updated.email!),
        name: updated.name ? decrypt(updated.name) : null,
      } as any
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
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const emailHash = hashValue(email)
        if (!checkRateLimit(`login:${emailHash}`)) return null

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
        return null
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
        const encryptedLogin = encrypt(twitchLogin)
        await prisma.twitchConnection.upsert({
          where: { userId: user.id as string },
          update: {
            twitchId: account.providerAccountId,
            twitchLogin: encryptedLogin,
            accessToken: account.access_token ?? undefined,
            refreshToken: account.refresh_token ?? undefined,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
          },
          create: {
            userId: user.id as string,
            twitchId: account.providerAccountId,
            twitchLogin: encryptedLogin,
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

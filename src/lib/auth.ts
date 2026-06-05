import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Twitch from "next-auth/providers/twitch"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"

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
    twitchToken?: {
      accessToken: string
      refreshToken: string
      expiresAt?: number
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
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

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
    Twitch({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "twitch" && user.id) {
        await prisma.twitchConnection.upsert({
          where: { userId: user.id },
          update: {
            twitchId: account.providerAccountId,
            twitchLogin: (profile as { login?: string })?.login ?? "",
            accessToken: account.access_token!,
            refreshToken: account.refresh_token!,
            expiresAt: new Date((account.expires_at ?? 0) * 1000),
          },
          create: {
            userId: user.id,
            twitchId: account.providerAccountId,
            twitchLogin: (profile as { login?: string })?.login ?? "",
            accessToken: account.access_token!,
            refreshToken: account.refresh_token!,
            expiresAt: new Date((account.expires_at ?? 0) * 1000),
          },
        })
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id!
      }
      if (account?.provider === "twitch") {
        token.twitchToken = {
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
          expiresAt: account.expires_at ?? undefined,
        }
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

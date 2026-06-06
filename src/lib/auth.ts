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
  }
}

type TwitchProfile = {
  sub?: string
  preferred_username?: string
  data?: Array<{ id: string; login: string; display_name: string; email?: string; profile_image_url?: string }>
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

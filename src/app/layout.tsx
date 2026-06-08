import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "@/components/shared/session-provider"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const siteUrl = process.env.AUTH_URL || "https://twitch-drops-alerts.duckdns.org"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Twitch Drops Alerts",
    template: "%s — Twitch Drops Alerts",
  },
  description:
    "Ne ratez plus aucun drop Twitch. Connectez vos comptes Twitch et Steam, et recevez une alerte personnalisée quand un drop correspond à votre bibliothèque de jeux.",
  openGraph: {
    title: "Twitch Drops Alerts",
    description:
      "Ne ratez plus aucun drop Twitch. Recevez une alerte quand un drop correspond à votre bibliothèque Steam.",
    url: siteUrl,
    siteName: "Twitch Drops Alerts",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Twitch Drops Alerts",
    description:
      "Ne ratez plus aucun drop Twitch. Recevez une alerte quand un drop correspond à votre bibliothèque Steam.",
  },
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

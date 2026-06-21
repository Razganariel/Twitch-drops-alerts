"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { loginSchema } from "@/lib/schemas/auth"

export function LoginForm({ twitchEnabled }: { twitchEnabled: boolean }) {
  const router = useRouter()
  const [error, setError] = useState<string | undefined>()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(undefined)
    setFieldErrors(null)

    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    })

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors)
      setIsPending(false)
      return
    }

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })

    if (result?.error) {
      setError("Email ou mot de passe incorrect")
      setIsPending(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Connexion</CardTitle>
        <CardDescription>
          Connectez-vous avec votre email ou via Twitch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="grid gap-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                suppressHydrationWarning
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" required suppressHydrationWarning />
            </div>
            {fieldErrors?.email && (
              <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
            )}
            {fieldErrors?.password && (
              <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </div>
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-card px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            disabled={!twitchEnabled}
            onClick={() => signIn("twitch", { redirectTo: "/dashboard" })}
          >
            {twitchEnabled ? "Connexion avec Twitch" : "Twitch non configuré"}
          </Button>
          <div className="text-center text-sm">
            Pas encore de compte ?{" "}
            <Link href="/register" className="underline underline-offset-4">
              S&apos;inscrire
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

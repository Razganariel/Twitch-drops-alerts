"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"

import { registerUser } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()

  async function handleSubmit(prevState: string | undefined, formData: FormData) {
    const error = await registerUser(prevState, formData)
    if (error) return error

    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    })

    router.push("/dashboard")
    return undefined
  }

  const [error, formAction, isPending] = useActionState(handleSubmit, undefined)

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Inscription</CardTitle>
        <CardDescription>
          Créez votre compte pour commencer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" type="text" placeholder="Jean Dupont" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Inscription..." : "Créer mon compte"}
            </Button>
          </div>
          <div className="text-center text-sm">
            Déjà un compte ?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Se connecter
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

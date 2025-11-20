"use client"

import type React from "react"

import { getSupabaseClient } from "@/lib/supabase/singleton-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { WaveBackground } from "@/components/wave-background"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Check if email exists in allowed_users
      const { data: user, error: userError } = await supabase
        .from("allowed_users")
        .select("id, email")
        .eq("email", email)
        .single()

      if (userError || !user) {
        throw new Error("This email is not registered with ESPERANZA CLUB.")
      }

      // Sign in with Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: email, // Email-only auth: password is same as email for simplicity
      })

      if (signInError) {
        // Try to sign up if user doesn't exist in auth
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              email: email,
            },
          },
        })

        if (signUpError && !signUpError.message.includes("already registered")) {
          throw signUpError
        }

        // Try to sign in again
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password: email,
        })

        if (retryError) throw retryError
      }

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <WaveBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="ESPERANZA CLUB" className="h-12 w-auto" />
        </div>

        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm glow">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center mt-2">Sign in with your registered email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input text-foreground border-primary/30"
                  disabled={isLoading}
                />
              </div>

              {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-sm mt-6">ESPERANZA CLUB Interview Reservation System</p>
      </div>
    </div>
  )
}

"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const result = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-dvh bg-black flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
               style={{ background: "linear-gradient(135deg,#0a84ff,#0040c1)", boxShadow: "0 8px 32px rgba(10,132,255,0.4)" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L25 9.5V18.5L14 25L3 18.5V9.5L14 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M14 9L20 12.5V19.5L14 23L8 19.5V12.5L14 9Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Trophic Tech</h1>
          <p className="mt-1 text-sm text-[rgba(235,235,245,0.5)]">Mission Control</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-[17px] font-semibold text-white mb-1">Sign in</h2>
          <p className="text-sm text-[rgba(235,235,245,0.5)] mb-6">
            Use your Trophic Tech credentials
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[rgba(235,235,245,0.6)] mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(235,235,245,0.3)]" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@trophictech.io"
                  className="input pl-10"
                  defaultValue="admin@trophictech.io"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[rgba(235,235,245,0.6)] mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(235,235,245,0.3)]" />
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pl-10"
                  defaultValue="demo1234"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[#ff6961]"
                   style={{ background: "rgba(255,69,58,0.1)", border: "0.5px solid rgba(255,69,58,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <p className="mt-5 text-center text-xs text-[rgba(235,235,245,0.3)]">
          Demo credentials pre-filled above
        </p>
      </div>
    </div>
  )
}

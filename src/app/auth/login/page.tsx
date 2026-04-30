'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Divider } from '@/components/ui/index'
import { BarChart3 } from 'lucide-react'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [mode,     setMode]     = useState<'signin' | 'signup'>('signin')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
        })
        if (error) throw error
        setError('Check your email to confirm your account.')
      }
    } catch {
      if (mode === 'signin') {
        setError("We didn't recognize those credentials — double-check your email and password and try again")
      } else {
        setError("We hit a small snag creating your account — please try again or contact support")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 mb-8">
        <span className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </span>
        <span className="text-lg">RedCube <span className="text-brand-600">WealthOS</span></span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="font-heading text-xl font-bold text-gray-900 mb-1">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'signin'
            ? 'Welcome back.'
            : 'Start your 14-day free trial today.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            required
            placeholder="you@firm.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            hint={mode === 'signup' ? 'Minimum 8 characters' : undefined}
          />

          {error && (
            <p className={`text-xs px-3 py-2 rounded-lg border ${
              error.includes('Check your email')
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full" size="md">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="mt-6">
          <Divider label="or" />
          <p className="text-center text-sm text-gray-500 mt-4">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
              className="text-brand-600 font-medium hover:underline"
            >
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center max-w-xs">
        By signing in you agree to our Terms of Service and Privacy Policy.
        For licensed financial advisors only.
      </p>
    </div>
  )
}

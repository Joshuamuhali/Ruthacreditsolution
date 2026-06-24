'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp, getRedirectPath } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName)
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setError('Account created. Sign in to continue.')
      setIsSignUp(false)
      setLoading(false)
      return
    }

    const { data, error: signInError } = await signIn(email, password)
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        router.push(getRedirectPath(profile.role as any))
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Rutha LMS</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">Loan Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[#1F2937] bg-[#111827] p-6">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB]">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9]"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#F9FAFB]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9]"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#F9FAFB]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9]"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className={`text-sm ${error.includes('created') ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6D28D9] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B21B6] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSignUp ? 'Create Account' : 'Sign In'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="text-center text-sm text-[#9CA3AF]">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              className="font-medium text-[#6D28D9] hover:text-[#7C3AED]"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          <a
            href="/"
            className="block text-center text-sm text-[#9CA3AF] hover:text-[#F9FAFB]"
          >
            ← Back to website
          </a>
        </form>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowRight, Loader2, MailCheck, Eye, EyeOff, Shield } from 'lucide-react'
import { useAuthAction } from '@/hooks/useAuthAction'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [oauthLoading, setOAuthLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmMessage, setShowConfirmMessage] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const [authCheckDone, setAuthCheckDone] = useState(false)
  const { signIn, signUp: signUpAction, isLoading: authLoading } = useAuthAction()

  useEffect(() => {
    let mounted = true
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session && mounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('kyc_status, role')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            // Route based on role and KYC status
            if (profile.role === 'admin' || profile.role === 'loan_ops') {
              router.push('/admin')
            } else if (profile.role === 'client') {
              // Client routing based on KYC status
              switch (profile.kyc_status) {
                case 'not_started':
                case 'in_progress':
                case 'rejected':
                  router.push('/kyc/onboarding')
                  break
                case 'submitted':
                case 'under_review':
                case 'completed':
                  router.push('/dashboard')
                  break
                default:
                  router.push('/kyc/onboarding')
              }
            }
          }
        }
      } finally {
        if (mounted) setAuthCheckDone(true)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && mounted) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('kyc_status, role')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          // Route based on role and KYC status
          if (profile.role === 'admin' || profile.role === 'loan_ops') {
            router.push('/admin')
          } else if (profile.role === 'client') {
            // Client routing based on KYC status
            switch (profile.kyc_status) {
              case 'not_started':
              case 'in_progress':
              case 'rejected':
                router.push('/kyc/onboarding')
                break
              case 'submitted':
              case 'under_review':
              case 'completed':
                router.push('/dashboard')
                break
              default:
                router.push('/kyc/onboarding')
            }
          }
        }
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (authLoading) return // Prevent double-click
    
    setError('')
    setShowConfirmMessage(false)

    try {
      if (isSignUp) {
        const { data, error } = await signUpAction(email, password, fullName)
        if (error) {
          setError(error.message)
          return
        }
        setShowConfirmMessage(true)
        return
      }

      const { data, error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(signInError.message)
        return
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#6D28D9] to-[#4C1D95]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <span className="text-xl font-bold text-white">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Rutha Credit</h1>
              <p className="text-sm text-purple-200">Solutions</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight">
            Your Financial<br />
            Growth Partner
          </h2>
          <p className="mt-4 text-purple-200 leading-relaxed max-w-md">
            Fast, reliable loan processing with real-time tracking. 
            Apply, get approved, and manage your loans from one place.
          </p>

          <div className="mt-12 space-y-5">
            {[
              { icon: '✓', text: 'Quick loan applications' },
              { icon: '✓', text: 'Real-time status tracking' },
              { icon: '✓', text: 'Secure document upload' },
              { icon: '✓', text: 'Transparent interest rates' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-400/20 text-green-300 text-sm font-bold">
                  {item.icon}
                </div>
                <span className="text-purple-100 text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          <p className="mt-auto mb-8 text-purple-300 text-xs">
            © 2026 Rutha Credit Solutions. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#4C1D95]">
              <span className="text-lg font-bold text-white">R</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Rutha Credit</h1>
              <p className="text-xs text-gray-500">Solutions</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="mt-1 text-gray-500">
              {isSignUp ? 'Start your loan journey in minutes' : 'Sign in to manage your loans'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-12 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {showConfirmMessage && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-start gap-3">
                  <MailCheck className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-800">Check your email</h3>
                    <p className="mt-1 text-xs text-emerald-600">
                      We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
                    </p>
                    <p className="mt-1.5 text-xs text-emerald-500">
                      Didn't receive it? Check your spam folder.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSignUp ? 'Create Account' : 'Sign In'}
              {!authLoading && <ArrowRight className="h-4 w-4" />}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400">or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (oauthLoading) return
                  setOAuthLoading(true)
                  try {
                    await supabase.auth.signInWithOAuth({ provider: 'google' })
                  } finally {
                    setOAuthLoading(false)
                  }
                }}
                disabled={oauthLoading}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {oauthLoading ? 'Loading...' : 'Google'}
              </button>
              <button
                type="button"
                disabled={oauthLoading}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {oauthLoading ? 'Loading...' : 'Facebook'}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setShowConfirmMessage(false) }}
                className="font-semibold text-[#6D28D9] hover:text-[#5B21B6]"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>

            <a href="/" className="block text-center text-sm text-gray-400 hover:text-gray-600">
              ← Back to website
            </a>
          </form>
        </div>
      </div>
    </div>
  )
}
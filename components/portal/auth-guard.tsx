'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { LoadingSpinner } from '@/components/ui/loading'
import { LogOut } from 'lucide-react'

type PortalAuthGuardProps = {
  children: React.ReactNode
}

export function PortalAuthGuard({ children }: PortalAuthGuardProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const MAX_RETRIES = 2

    async function loadProfile() {
      try {
        // First check if session exists
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          if (mounted) {
            router.push('/auth')
          }
          return
        }

        // Try to fetch profile with retry
        let profileData: Profile | null = null
        let profileError: any = null

        while (retryCount < MAX_RETRIES && !profileData) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) {
              profileError = error
              retryCount++
              if (retryCount < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 500))
                continue
              }
            } else {
              profileData = data
              break
            }
          } catch (err) {
            profileError = err
            retryCount++
            if (retryCount < MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
        }

        if (!mounted) return

        // If profile fetch failed but session exists, show error but don't kick out
        if (!profileData && profileError) {
          console.error('Profile fetch failed:', profileError)
          setError('Failed to load profile data. Some features may be limited.')
          // Still allow access - session is valid
          setLoading(false)
          return
        }

        if (!profileData) {
          // No profile but session exists - create minimal profile state
          setError('Profile not found. Please contact support.')
          setLoading(false)
          return
        }

        // Check role - only allow clients
        if (profileData.role !== 'client') {
          router.push('/admin')
          return
        }

        setProfile(profileData)
        setLoading(false)
      } catch (err) {
        if (!mounted) return
        console.error('Auth guard error:', err)
        setError('Authentication error occurred')
        setLoading(false)
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!profile) return null

  async function handleSignOut() {
    const { signOut } = await import('@/lib/auth')
    await signOut()
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <header className="border-b border-[#1F2937] bg-[#111827]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D28D9]">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F9FAFB]">Rutha Credit Solutions</p>
              <p className="text-[10px] text-[#9CA3AF]">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#9CA3AF]">{profile.full_name}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6">{children}</div>
    </div>
  )
}
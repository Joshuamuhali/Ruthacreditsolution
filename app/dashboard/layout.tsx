'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PortalSidebar } from '@/components/portal/sidebar'
import type { Profile } from '@/lib/types'
import { LoadingSpinner } from '@/components/ui/loading'
import { X } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
            window.location.href = '/auth'
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
          setLoading(false)
          return
        }

        if (!profileData) {
          setError('Profile not found. Please contact support.')
          setLoading(false)
          return
        }

        setProfile(profileData)
        setLoading(false)
      } catch (err) {
        if (!mounted) return
        console.error('Dashboard layout error:', err)
        setError('Authentication error occurred')
        setLoading(false)
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [])

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

  return (
    <div className="flex min-h-screen bg-[#0B0F1A]">
      <PortalSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden fixed top-4 left-4 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg bg-[#111827] p-2 text-[#9CA3AF] hover:text-[#F9FAFB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import type { Profile } from '@/lib/types'
import { Loader2, LogOut, Bell, ChevronLeft } from 'lucide-react'

type PortalAuthGuardProps = {
  children: React.ReactNode
}

export function PortalAuthGuard({ children }: PortalAuthGuardProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getCurrentProfile().then((p) => {
      if (!p || p.role !== 'client') {
        router.push('/auth')
        return
      }
      setProfile(p)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" />
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
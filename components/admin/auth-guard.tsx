'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { Sidebar } from './sidebar'
import type { Profile } from '@/lib/types'
import { Loader2 } from 'lucide-react'

type AuthGuardProps = {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'loan_ops')[]
}

export function AdminAuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getCurrentProfile().then((p) => {
      if (!p || p.role === 'client') {
        router.push('/auth')
        return
      }
      if (allowedRoles && !allowedRoles.includes(p.role)) {
        router.push('/admin')
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

  return (
    <div className="flex min-h-screen bg-[#0B0F1A]">
      <Sidebar role={profile.role} />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
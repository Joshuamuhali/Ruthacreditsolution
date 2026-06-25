'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import type { Profile, Notification } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { PortalSidebar } from '@/components/portal/sidebar'
import { Loader2, Bell, LogOut, Menu } from 'lucide-react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
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
  }, [router])

  useEffect(() => {
    if (!profile) return
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    loadUnreadCount()
    return () => { supabase.removeChannel(channel) }
  }, [profile])

  async function loadUnreadCount() {
    if (!profile) return
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('read', false)
    setUnreadCount(count || 0)
  }

  async function handleSignOut() {
    const { signOut } = await import('@/lib/auth')
    await signOut()
    router.push('/auth')
  }

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
      <PortalSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1F2937] bg-[#111827] px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[#9CA3AF] hover:text-[#F9FAFB] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <a
              href="/dashboard/apply"
              className="hidden rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6] sm:inline-flex"
            >
              Quick Apply
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications bell */}
            <button
              onClick={() => router.push('/dashboard/notifications')}
              className="relative rounded-lg p-2 text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6D28D9]">
                <span className="text-sm font-bold text-white">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-[#F9FAFB]">{profile.full_name}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
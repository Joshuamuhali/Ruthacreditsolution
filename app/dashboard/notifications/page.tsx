'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, CheckCheck, Trash2, Calendar, CheckCircle, AlertTriangle, XCircle, CreditCard } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading'
import type { Notification } from '@/lib/types'

const typeIcons: Record<string, React.ReactNode> = {
  approval: <CheckCircle className="h-5 w-5 text-[#16A34A]" />,
  rejection: <XCircle className="h-5 w-5 text-[#DC2626]" />,
  payment: <CreditCard className="h-5 w-5 text-[#2563EB]" />,
  overdue: <AlertTriangle className="h-5 w-5 text-[#DC2626]" />,
  reminder: <Calendar className="h-5 w-5 text-[#6D28D9]" />,
  system: <Bell className="h-5 w-5 text-[#9CA3AF]" />,
}

const typeColors: Record<string, string> = {
  approval: 'bg-[#16A34A]/10',
  rejection: 'bg-[#DC2626]/10',
  payment: 'bg-[#2563EB]/10',
  overdue: 'bg-[#DC2626]/10',
  reminder: 'bg-[#6D28D9]/10',
  system: 'bg-[#1F2937]',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setNotifications((data as Notification[]) || [])
    setLoading(false)
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  async function markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-700" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-700" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-700" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Notifications</h1>
          <p className="text-sm text-[#9CA3AF]">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#1F2937] overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium ${
                filter === 'all' ? 'bg-[#6D28D9] text-white' : 'bg-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-medium ${
                filter === 'unread' ? 'bg-[#6D28D9] text-white' : 'bg-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              Unread
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 rounded-lg border border-[#1F2937] px-3 py-1.5 text-xs text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-[#374151]" />
          <h3 className="mt-4 text-lg font-semibold text-[#F9FAFB]">No notifications</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {filter === 'unread' ? 'All notifications have been read.' : 'You haven\'t received any notifications yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border ${
                notification.read ? 'border-[#1F2937] bg-[#111827]' : 'border-[#6D28D9]/30 bg-[#1F2937]'
              } transition-colors`}
            >
              <div className="flex items-start gap-4 px-5 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${typeColors[notification.type] || 'bg-[#1F2937]'}`}>
                  {typeIcons[notification.type] || <Bell className="h-5 w-5 text-[#9CA3AF]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-medium ${notification.read ? 'text-[#F9FAFB]' : 'text-[#F9FAFB]'}`}>
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-sm text-[#9CA3AF]">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="rounded p-1 text-[#9CA3AF] hover:bg-[#111827] hover:text-[#6D28D9]"
                          title="Mark as read"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="rounded p-1 text-[#9CA3AF] hover:bg-[#111827] hover:text-[#DC2626]"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-[#6B7280]">
                    {new Date(notification.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6D28D9]" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/auth-guard'
import { supabase } from '@/lib/supabase'
import { createAuditLog, getCurrentProfile } from '@/lib/auth'
import { Loader2, Shield } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    getCurrentProfile().then(setProfile)
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as Profile[]) || [])
    setLoading(false)
  }

  async function changeRole(userId: string, newRole: string) {
    if (!profile) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    await createAuditLog(profile.id, profile.full_name, 'User Role Changed', 'user', userId, { new_role: newRole })
    loadUsers()
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-[#6D28D9]/10 text-[#6D28D9]',
    loan_ops: 'bg-[#2563EB]/10 text-[#2563EB]',
    client: 'bg-[#16A34A]/10 text-[#16A34A]',
  }

  return (
    <AdminAuthGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Users</h1>
          <p className="text-sm text-[#9CA3AF]">Manage system users and roles</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" /></div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#1F2937]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#111827]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#1F2937] hover:bg-[#111827]/50">
                    <td className="px-4 py-3 text-sm font-medium text-[#F9FAFB]">{u.full_name}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[u.role]}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== profile?.id && (
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className="rounded-lg border border-[#374151] bg-[#1F2937] px-2 py-1 text-xs text-[#F9FAFB] outline-none focus:border-[#6D28D9]"
                        >
                          <option value="client">Client</option>
                          <option value="loan_ops">Loan Ops</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/auth-guard'
import { supabase } from '@/lib/supabase'
import { Loader2, Shield } from 'lucide-react'
import type { AuditLog } from '@/lib/types'

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs((data as AuditLog[]) || [])
        setLoading(false)
      })
  }, [])

  return (
    <AdminAuthGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Audit Log</h1>
          <p className="text-sm text-[#9CA3AF]">Track all system actions</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" /></div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#1F2937]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#111827]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Entity</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF]">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#1F2937] hover:bg-[#111827]/50">
                    <td className="px-4 py-3 text-sm text-[#F9FAFB]">{log.user_name}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{log.entity} / {log.entity_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-right text-sm text-[#9CA3AF]">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-[#6B7280]"><Shield className="mx-auto mb-2 h-8 w-8 text-[#374151]" />No audit logs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  )
}
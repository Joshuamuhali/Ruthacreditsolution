'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/auth-guard'
import { supabase } from '@/lib/supabase'
import { createAuditLog, getCurrentProfile } from '@/lib/auth'
import { Search, Loader2, CheckCircle, XCircle, Eye } from 'lucide-react'
import type { Application, Profile } from '@/lib/types'

type AppWithProfile = Application & { reviewer_name?: string }

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<AppWithProfile | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    getCurrentProfile().then(setProfile)
    loadApps()
  }, [])

  async function loadApps() {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false })
    setApps((data as AppWithProfile[]) || [])
    setLoading(false)
  }

  const filtered = apps.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return a.full_name.toLowerCase().includes(q) || a.phone.includes(q)
    }
    return true
  })

  async function handleStatus(id: string, status: 'under_review' | 'approved' | 'rejected') {
    if (!profile) return
    setActionLoading(true)

    await supabase
      .from('applications')
      .update({ status, reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)

    await createAuditLog(profile.id, profile.full_name, `Application ${status}`, 'application', id)

    if (status === 'approved') {
      const app = apps.find((a) => a.id === id)
      if (app) {
        await supabase.from('loans').insert({
          application_id: id,
          client_id: app.client_id,
          approved_amount: app.requested_amount,
          interest_rate: 0,
          loan_term_months: 1,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          approved_by: profile.id,
          status: 'approved',
        })
        await createAuditLog(profile.id, profile.full_name, 'Loan created from application', 'loan', id)
      }
    }

    setActionLoading(false)
    setSelected(null)
    loadApps()
  }

  const statusColors: Record<string, string> = {
    submitted: 'bg-[#2563EB]/10 text-[#2563EB]',
    under_review: 'bg-[#6D28D9]/10 text-[#6D28D9]',
    approved: 'bg-[#16A34A]/10 text-[#16A34A]',
    rejected: 'bg-[#DC2626]/10 text-[#DC2626]',
  }

  return (
    <AdminAuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F9FAFB]">Applications</h1>
            <p className="text-sm text-[#9CA3AF]">Manage incoming loan applications</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-lg border border-[#374151] bg-[#1F2937] py-2 pl-10 pr-3 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9]"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#1F2937]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#111827]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF]">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b border-[#1F2937] hover:bg-[#111827]/50">
                    <td className="px-4 py-3 text-sm font-medium text-[#F9FAFB]">{app.full_name}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{app.phone}</td>
                    <td className="px-4 py-3 text-sm text-[#F9FAFB]">ZMW {Number(app.requested_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{app.loan_type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[app.status]}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{new Date(app.submitted_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(app)}
                        className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#6B7280]">
                      No applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl border border-[#1F2937] bg-[#111827] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#F9FAFB]">Application Details</h2>
                <button onClick={() => setSelected(null)} className="text-[#9CA3AF] hover:text-[#F9FAFB]">✕</button>
              </div>

              <div className="mt-4 space-y-3">
                <Row label="Full Name" value={selected.full_name} />
                <Row label="Phone" value={selected.phone} />
                <Row label="NRC" value={selected.nrc} />
                <Row label="Income" value={`ZMW ${Number(selected.income).toLocaleString()}`} />
                <Row label="Loan Type" value={selected.loan_type} />
                <Row label="Requested Amount" value={`ZMW ${Number(selected.requested_amount).toLocaleString()}`} />
                <Row label="Status" value={selected.status.replace('_', ' ')} />
                <Row label="Submitted" value={new Date(selected.submitted_at).toLocaleString()} />
                {selected.notes && <Row label="Notes" value={selected.notes} />}
              </div>

              {selected.status === 'submitted' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleStatus(selected.id, 'under_review')}
                    disabled={actionLoading}
                    className="flex-1 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Move to Review'}
                  </button>
                </div>
              )}

              {selected.status === 'under_review' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleStatus(selected.id, 'approved')}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 flex-1 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-medium text-white hover:bg-[#15803D] disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatus(selected.id, 'rejected')}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 flex-1 rounded-lg bg-[#DC2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#B91C1C] disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </button>
                </div>
              )}

              {selected.status === 'approved' && (
                <p className="mt-4 text-sm text-[#16A34A]">Approved - Loan record created</p>
              )}
              {selected.status === 'rejected' && (
                <p className="mt-4 text-sm text-[#DC2626]">Application rejected</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-[#9CA3AF]">{label}</span>
      <span className="text-sm font-medium text-[#F9FAFB]">{value}</span>
    </div>
  )
}
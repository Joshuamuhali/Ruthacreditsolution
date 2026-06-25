'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/auth-guard'
import { supabase } from '@/lib/supabase'
import { createAuditLog, getCurrentProfile } from '@/lib/auth'
import { Search, Eye, Edit } from 'lucide-react'
import { LoadingTable } from '@/components/ui/loading'
import type { Loan, Profile } from '@/lib/types'

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Loan | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    getCurrentProfile().then(setProfile)
    loadLoans()
  }, [])

  async function loadLoans() {
    const { data } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false })
    setLoans((data as Loan[]) || [])
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    approved: 'bg-[#2563EB]/10 text-[#2563EB]',
    funded: 'bg-[#6D28D9]/10 text-[#6D28D9]',
    active: 'bg-[#16A34A]/10 text-[#16A34A]',
    completed: 'bg-[#9CA3AF]/10 text-[#9CA3AF]',
    overdue: 'bg-[#DC2626]/10 text-[#DC2626]',
    defaulted: 'bg-[#991B1B]/10 text-[#DC2626]',
  }

  const filtered = loans.filter((l) => {
    if (filter !== 'all' && l.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return l.id.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <AdminAuthGuard allowedRoles={['admin', 'loan_ops']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F9FAFB]">Loans</h1>
            <p className="text-sm text-[#9CA3AF]">Active and past loan records</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search by ID..."
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
              <option value="approved">Approved</option>
              <option value="funded">Funded</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="overflow-hidden rounded-xl border border-[#1F2937]">
            <div className="border-b border-[#1F2937] bg-[#111827] px-4 py-3">
              <div className="flex gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-3 w-20 animate-pulse rounded bg-gray-700" />
                ))}
              </div>
            </div>
            <LoadingTable rows={5} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#1F2937]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#111827]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Loan ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Interest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF]">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((loan) => (
                  <tr key={loan.id} className="border-b border-[#1F2937] hover:bg-[#111827]/50">
                    <td className="px-4 py-3 text-sm text-[#F9FAFB]">{loan.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-[#F9FAFB]">ZMW {Number(loan.principal).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#9CA3AF]">{loan.interest_rate}%</td>
                  <td className="px-4 py-3 text-sm text-[#F9FAFB]">ZMW {Number(loan.total_repayable).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#16A34A]">ZMW {Number(loan.total_repayable - loan.remaining_balance).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#9CA3AF]">{loan.disbursed_at ? new Date(loan.disbursed_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[loan.status]}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setSelected(loan); setEditMode(false) }}
                        className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-[#6B7280]">
                      No loans found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  )
}
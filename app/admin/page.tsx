'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/auth-guard'
import { supabase } from '@/lib/supabase'
import { ClipboardList, Landmark, Wallet, AlertTriangle } from 'lucide-react'
import { LoadingStats } from '@/components/ui/loading'
import type { DashboardMetrics } from '@/lib/types'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [apps, loans, disb] = await Promise.all([
        supabase.from('applications').select('status'),
        supabase.from('loans').select('status, approved_amount'),
        supabase.from('disbursements').select('amount_sent'),
      ])

      const allApps = apps.data || []
      const allLoans = loans.data || []
      const allDisb = disb.data || []

      const m: DashboardMetrics = {
        total_applications: allApps.length,
        pending_review: allApps.filter((a) => a.status === 'submitted').length,
        approved_loans: allLoans.filter((l) => l.status === 'approved' || l.status === 'funded').length,
        active_loans: allLoans.filter((l) => l.status === 'active').length,
        total_disbursed: allDisb.reduce((sum, d) => sum + Number(d.amount_sent), 0),
        overdue_loans: allLoans.filter((l) => l.status === 'overdue').length,
        collection_rate: 0,
      }

      setMetrics(m)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AdminAuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Dashboard</h1>
          <p className="text-sm text-[#9CA3AF]">Loan operations overview</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <LoadingStats count={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-700 mb-2" />
                  <div className="h-8 w-24 animate-pulse rounded bg-gray-700" />
                </div>
              ))}
            </div>
          </div>
        ) : metrics ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={ClipboardList} label="Pending Review" value={metrics.pending_review} color="text-[#2563EB]" />
              <MetricCard icon={Landmark} label="Active Loans" value={metrics.active_loans} color="text-[#16A34A]" />
              <MetricCard icon={Wallet} label="Total Disbursed" value={`ZMW ${metrics.total_disbursed.toLocaleString()}`} color="text-[#6D28D9]" />
              <MetricCard icon={AlertTriangle} label="Overdue" value={metrics.overdue_loans} color="text-[#DC2626]" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
                <h3 className="text-sm font-semibold text-[#9CA3AF]">Total Applications</h3>
                <p className="mt-2 text-3xl font-bold text-[#F9FAFB]">{metrics.total_applications}</p>
              </div>
              <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
                <h3 className="text-sm font-semibold text-[#9CA3AF]">Approved Loans</h3>
                <p className="mt-2 text-3xl font-bold text-[#16A34A]">{metrics.approved_loans}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Quick Actions</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/admin/applications"
                  className="rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6]"
                >
                  Review Applications
                </a>
                <a
                  href="/admin/disbursements"
                  className="rounded-lg border border-[#374151] px-4 py-2 text-sm font-medium text-[#F9FAFB] hover:bg-[#1F2937]"
                >
                  Record Disbursement
                </a>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminAuthGuard>
  )
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F2937]">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF]">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}
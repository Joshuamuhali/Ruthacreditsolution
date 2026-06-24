'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/auth-guard'
import { supabase } from '@/lib/supabase'
import { Loader2, Download } from 'lucide-react'

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [apps, loans, disb, reps] = await Promise.all([
        supabase.from('applications').select('status'),
        supabase.from('loans').select('status, approved_amount, amount_paid, total_repayable'),
        supabase.from('disbursements').select('amount_sent'),
        supabase.from('repayments').select('amount'),
      ])

      const allLoans = loans.data || []
      const allDisb = disb.data || []
      const allReps = reps.data || []
      const totalDisbursed = allDisb.reduce((s, d) => s + Number(d.amount_sent), 0)
      const totalRepaid = allReps.reduce((s, r) => s + Number(r.amount), 0)
      const activeLoans = allLoans.filter((l) => l.status === 'active')
      const overdueLoans = allLoans.filter((l) => l.status === 'overdue')

      setData({
        total_applications: apps.data?.length || 0,
        approved_loans: allLoans.filter((l) => ['approved', 'funded', 'active', 'completed'].includes(l.status)).length,
        active_loans: activeLoans.length,
        overdue_loans: overdueLoans.length,
        total_disbursed: totalDisbursed,
        total_repaid: totalRepaid,
        collection_rate: totalDisbursed > 0 ? ((totalRepaid / totalDisbursed) * 100).toFixed(1) : '0',
        total_outstanding: allLoans.reduce((s, l) => s + (Number(l.total_repayable) - Number(l.amount_paid)), 0),
      })
      setLoading(false)
    }
    load()
  }, [])

  function exportCSV() {
    if (!data) return
    const headers = ['Metric', 'Value']
    const rows = Object.entries(data).map(([k, v]) => [k.replace(/_/g, ' '), v])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rutha-lms-report.csv'
    a.click()
  }

  return (
    <AdminAuthGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F9FAFB]">Reports</h1>
            <p className="text-sm text-[#9CA3AF]">Lending performance overview</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-[#374151] px-4 py-2 text-sm font-medium text-[#F9FAFB] hover:bg-[#1F2937]">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" /></div>
        ) : data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReportCard label="Total Applications" value={data.total_applications} />
            <ReportCard label="Approved Loans" value={data.approved_loans} color="text-[#16A34A]" />
            <ReportCard label="Active Loans" value={data.active_loans} color="text-[#2563EB]" />
            <ReportCard label="Overdue Loans" value={data.overdue_loans} color="text-[#DC2626]" />
            <ReportCard label="Total Disbursed" value={`ZMW ${Number(data.total_disbursed).toLocaleString()}`} color="text-[#6D28D9]" />
            <ReportCard label="Total Repaid" value={`ZMW ${Number(data.total_repaid).toLocaleString()}`} color="text-[#16A34A]" />
            <ReportCard label="Outstanding" value={`ZMW ${Number(data.total_outstanding).toLocaleString()}`} color="text-[#DC2626]" />
            <ReportCard label="Collection Rate" value={`${data.collection_rate}%`} color="text-[#2563EB]" />
          </div>
        ) : null}
      </div>
    </AdminAuthGuard>
  )
}

function ReportCard({ label, value, color = 'text-[#F9FAFB]' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
      <p className="text-xs text-[#9CA3AF]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
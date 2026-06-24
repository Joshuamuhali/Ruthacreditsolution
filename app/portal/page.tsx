'use client'

import { useEffect, useState } from 'react'
import { PortalAuthGuard } from '@/components/portal/auth-guard'
import { supabase } from '@/lib/supabase'
import { Loader2, Landmark, Wallet, Calendar, ArrowRight } from 'lucide-react'
import type { Loan, Application } from '@/lib/types'

export default function PortalDashboard() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) return

      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', profile.id)

      const clientIds = (clients || []).map((c: any) => c.id)

      if (clientIds.length > 0) {
        const [l, a] = await Promise.all([
          supabase.from('loans').select('*').in('client_id', clientIds).order('created_at', { ascending: false }),
          supabase.from('applications').select('*').in('client_id', clientIds).order('submitted_at', { ascending: false }),
        ])
        setLoans((l.data as Loan[]) || [])
        setApps((a.data as Application[]) || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  const activeLoan = loans.find((l) => l.status === 'active' || l.status === 'funded')
  const totalBorrowed = loans.reduce((s, l) => s + Number(l.approved_amount), 0)
  const nextDue = loans
    .filter((l) => l.status === 'active' || l.status === 'funded')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

  const statusColors: Record<string, string> = {
    submitted: 'bg-[#2563EB]/10 text-[#2563EB]',
    under_review: 'bg-[#6D28D9]/10 text-[#6D28D9]',
    approved: 'bg-[#16A34A]/10 text-[#16A34A]',
    rejected: 'bg-[#DC2626]/10 text-[#DC2626]',
  }

  return (
    <PortalAuthGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">My Dashboard</h1>
          <p className="text-sm text-[#9CA3AF]">Track your loan status and activity</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" /></div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F2937]">
                    <Landmark className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Loan Status</p>
                    <p className="text-lg font-bold text-[#F9FAFB]">
                      {activeLoan ? activeLoan.status : 'No active loan'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F2937]">
                    <Wallet className="h-5 w-5 text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Current Balance</p>
                    <p className="text-lg font-bold text-[#F9FAFB]">
                      {activeLoan ? `ZMW ${Number(activeLoan.total_repayable - activeLoan.amount_paid).toLocaleString()}` : 'ZMW 0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F2937]">
                    <Landmark className="h-5 w-5 text-[#6D28D9]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Total Borrowed</p>
                    <p className="text-lg font-bold text-[#F9FAFB]">ZMW {totalBorrowed.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F2937]">
                    <Calendar className="h-5 w-5 text-[#DC2626]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Next Due Date</p>
                    <p className="text-lg font-bold text-[#F9FAFB]">
                      {nextDue ? new Date(nextDue.due_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Applications */}
            {apps.length > 0 && (
              <div className="rounded-xl border border-[#1F2937] bg-[#111827]">
                <div className="border-b border-[#1F2937] px-6 py-4">
                  <h2 className="text-sm font-semibold text-[#F9FAFB]">My Applications</h2>
                </div>
                <div className="divide-y divide-[#1F2937]">
                  {apps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm text-[#F9FAFB]">{app.loan_type} - ZMW {Number(app.requested_amount).toLocaleString()}</p>
                        <p className="text-xs text-[#9CA3AF]">{new Date(app.submitted_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[app.status]}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loans */}
            {loans.length > 0 && (
              <div className="rounded-xl border border-[#1F2937] bg-[#111827]">
                <div className="border-b border-[#1F2937] px-6 py-4">
                  <h2 className="text-sm font-semibold text-[#F9FAFB]">My Loans</h2>
                </div>
                <div className="divide-y divide-[#1F2937]">
                  {loans.map((loan) => (
                    <div key={loan.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#F9FAFB]">
                            Loan - ZMW {Number(loan.approved_amount).toLocaleString()}
                          </p>
                          <div className="mt-1 flex gap-4 text-xs text-[#9CA3AF]">
                            <span>Total: ZMW {Number(loan.total_repayable).toLocaleString()}</span>
                            <span>Paid: ZMW {Number(loan.amount_paid).toLocaleString()}</span>
                            <span>Due: {new Date(loan.due_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          loan.status === 'active' ? 'bg-[#16A34A]/10 text-[#16A34A]' :
                          loan.status === 'overdue' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
                          loan.status === 'completed' ? 'bg-[#9CA3AF]/10 text-[#9CA3AF]' :
                          'bg-[#2563EB]/10 text-[#2563EB]'
                        }`}>
                          {loan.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {apps.length === 0 && loans.length === 0 && (
              <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-12 text-center">
                <Landmark className="mx-auto h-12 w-12 text-[#374151]" />
                <h3 className="mt-4 text-lg font-semibold text-[#F9FAFB]">No loans yet</h3>
                <p className="mt-2 text-sm text-[#9CA3AF]">
                  Submit a loan application through our website to get started.
                </p>
                <a
                  href="/"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6]"
                >
                  Apply Now <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </PortalAuthGuard>
  )
}
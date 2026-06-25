'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronUp, Download, FileText, Calendar, Wallet, Percent } from 'lucide-react'
import { LoadingTable } from '@/components/ui/loading'
import type { Loan, RepaymentSchedule } from '@/lib/types'
import Link from 'next/link'

export default function MyLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [schedules, setSchedules] = useState<RepaymentSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const loansList = (loansData as Loan[]) || []
      setLoans(loansList)

      if (loansList.length > 0) {
        const { data: schedData } = await supabase
          .from('repayment_schedule')
          .select('*')
          .in('loan_id', loansList.map((l) => l.id))
          .order('installment_number', { ascending: true })

        setSchedules((schedData as RepaymentSchedule[]) || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  const formatCurrency = (amount: number) =>
    `ZMW ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const statusColors: Record<string, string> = {
    active: 'bg-[#2563EB]/10 text-[#2563EB]',
    completed: 'bg-[#9CA3AF]/10 text-[#9CA3AF]',
    defaulted: 'bg-[#DC2626]/20 text-[#DC2626]',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#111827]">
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-700" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-700" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-700" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-700" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-700" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loans.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">My Loans</h1>
          <p className="text-sm text-[#9CA3AF]">You don't have any loans yet. Loans appear here after approval and disbursement.</p>
        </div>
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-12 text-center">
          <Wallet className="mx-auto h-12 w-12 text-[#374151]" />
          <h3 className="mt-4 text-lg font-semibold text-[#F9FAFB]">No loans found</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Loans are created only after your application is approved, collateral is verified, and funds are disbursed.
          </p>
          <Link
            href="/dashboard/apply"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6]"
          >
            Apply for a Loan
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F9FAFB]">My Loans</h1>
        <p className="text-sm text-[#9CA3AF]">View your active and completed loans</p>
      </div>

      <div className="space-y-3">
        {loans.map((loan) => {
          const isExpanded = expandedLoan === loan.id
          const loanSchedules = schedules.filter((s) => s.loan_id === loan.id)
          const progress = loan.total_repayable > 0
            ? Math.round((1 - Number(loan.remaining_balance) / Number(loan.total_repayable)) * 100)
            : 0

          return (
            <div key={loan.id} className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#111827]">
              {/* Summary */}
              <button
                onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#1F2937]/50"
              >
                <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Loan ID</p>
                    <p className="text-sm font-medium text-[#F9FAFB]">#{loan.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Principal</p>
                    <p className="text-sm font-medium text-[#F9FAFB]">{formatCurrency(Number(loan.principal))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Interest</p>
                    <p className="text-sm font-medium text-[#F9FAFB]">{loan.interest_rate}%</p>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-xs text-[#9CA3AF]">Status</p>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[loan.status] || 'bg-[#9CA3AF]/10 text-[#9CA3AF]'}`}>
                      {loan.status}
                    </span>
                  </div>
                </div>
                <div className="ml-4 text-[#9CA3AF]">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-[#1F2937]">
                  {/* Progress bar */}
                  <div className="px-5 py-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs text-[#9CA3AF]">Repayment Progress</span>
                      <span className="text-xs font-medium text-[#F9FAFB]">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1F2937]">
                      <div className="h-2 rounded-full bg-[#6D28D9] transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-[#9CA3AF]">
                      <span>Paid: {formatCurrency(Number(loan.total_repayable) - Number(loan.remaining_balance))}</span>
                      <span>Balance: {formatCurrency(Number(loan.remaining_balance))}</span>
                      <span>Total: {formatCurrency(Number(loan.total_repayable))}</span>
                    </div>
                  </div>

                  {/* Loan details */}
                  <div className="grid grid-cols-2 gap-4 px-5 pb-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-[#1F2937] p-3">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-[#6D28D9]" />
                        <div>
                          <p className="text-[10px] text-[#9CA3AF]">Interest Rate</p>
                          <p className="text-sm font-medium text-[#F9FAFB]">{loan.interest_rate}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#1F2937] p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#2563EB]" />
                        <div>
                          <p className="text-[10px] text-[#9CA3AF]">Disbursed</p>
                          <p className="text-sm font-medium text-[#F9FAFB]">{loan.disbursed_at ? new Date(loan.disbursed_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#1F2937] p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#16A34A]" />
                        <div>
                          <p className="text-[10px] text-[#9CA3AF]">Term</p>
                          <p className="text-sm font-medium text-[#F9FAFB]">{loan.loan_term_months} months</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#1F2937] p-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-[#EAB308]" />
                        <div>
                          <p className="text-[10px] text-[#9CA3AF]">Monthly Payment</p>
                          <p className="text-sm font-medium text-[#F9FAFB]">
                            {formatCurrency(Number(loan.total_repayable) / loan.loan_term_months)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Repayment Schedule from DB */}
                  {loanSchedules.length > 0 && (
                    <div className="border-t border-[#1F2937] px-5 py-4">
                      <h3 className="mb-3 text-sm font-semibold text-[#F9FAFB]">Repayment Schedule</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-[#1F2937] text-[#9CA3AF]">
                              <th className="pb-2 pr-4 text-xs font-medium">#</th>
                              <th className="pb-2 pr-4 text-xs font-medium">Due Date</th>
                              <th className="pb-2 pr-4 text-xs font-medium">Amount Due</th>
                              <th className="pb-2 text-xs font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loanSchedules.map((inst) => {
                              const statusColor = inst.status === 'paid' ? 'text-[#16A34A]' : inst.status === 'overdue' ? 'text-[#DC2626]' : 'text-[#EAB308]'
                              return (
                                <tr key={inst.id} className="border-b border-[#1F2937]/50">
                                  <td className="py-2 pr-4 text-[#9CA3AF]">{inst.installment_number}</td>
                                  <td className="py-2 pr-4 text-[#F9FAFB]">{new Date(inst.due_date).toLocaleDateString()}</td>
                                  <td className="py-2 pr-4 text-[#F9FAFB]">{formatCurrency(Number(inst.amount_due))}</td>
                                  <td className="py-2">
                                    <span className={`text-xs font-medium capitalize ${statusColor}`}>{inst.status}</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Loan events/timeline */}
                  <div className="border-t border-[#1F2937] px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      {loan.status === 'active' && (
                        <Link
                          href="/dashboard/payments"
                          className="rounded-lg bg-[#6D28D9] px-4 py-2 text-xs font-medium text-white hover:bg-[#5B21B6]"
                        >
                          Make Payment
                        </Link>
                      )}
                      <button
                        className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs font-medium text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
                        onClick={() => alert('Download statement feature coming soon')}
                      >
                        <Download className="mr-1 inline h-3.5 w-3.5" />
                        Download Statement
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
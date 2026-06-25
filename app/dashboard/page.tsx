'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { Landmark, Wallet, Calendar, AlertTriangle, CheckCircle, Clock, XCircle, ArrowRight, Shield, Lock, UserCheck, FileText, Upload } from 'lucide-react'
import { LoadingSpinner, LoadingStats, LoadingTable } from '@/components/ui/loading'
import type { LoanApplication, Loan, RepaymentSchedule, Profile, KYCStatus } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardOverview() {
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [schedules, setSchedules] = useState<RepaymentSchedule[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const [appsRes, loansRes, profileRes] = await Promise.all([
        supabase.from('loan_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('loans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])

      const loansData = (loansRes.data as Loan[]) || []
      setApplications((appsRes.data as LoanApplication[]) || [])
      setLoans(loansData)
      setProfile(profileRes.data as Profile)

      // Load repayment schedules for active loans
      if (loansData.length > 0) {
        const loanIds = loansData.map(l => l.id)
        const { data: schedData } = await supabase
          .from('repayment_schedule')
          .select('*')
          .in('loan_id', loanIds)
          .order('due_date', { ascending: true })
        setSchedules((schedData as RepaymentSchedule[]) || [])
      }

      setLoading(false)
    }
    load()
  }, [router])

  // Compute metrics
  const activeLoans = loans.filter((l) => l.status === 'active')
  const totalOutstanding = activeLoans.reduce((s, l) => s + Number(l.remaining_balance), 0)
  const totalActiveCount = activeLoans.length

  // Next repayment (earliest due schedule item across all active loans)
  const pendingSchedules = schedules.filter(s => s.status === 'pending' || s.status === 'overdue')
  const nextDueItem = pendingSchedules.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0] || null

  // Status summary
  const statusSummary = {
    active: activeLoans.length,
    pending: applications.filter((a) => !['approved', 'rejected', 'disbursed'].includes(a.status)).length,
    completed: loans.filter((l) => l.status === 'completed').length,
    overdue: schedules.filter((s) => s.status === 'overdue').length,
  }

  const formatCurrency = (amount: number) => `ZMW ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // KYC Status helpers
  const getKYCStatusConfig = (status: KYCStatus) => {
    const configs: Record<KYCStatus, { color: string; icon: any; label: string; description: string }> = {
      not_started: {
        color: 'bg-gray-50 border-gray-200 text-gray-700',
        icon: FileText,
        label: 'KYC Not Started',
        description: 'Complete your identity verification to unlock loan applications'
      },
      in_progress: {
        color: 'bg-blue-50 border-blue-200 text-blue-700',
        icon: Upload,
        label: 'KYC In Progress',
        description: 'Continue completing your verification steps'
      },
      submitted: {
        color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        icon: Clock,
        label: 'KYC Submitted',
        description: 'Your documents are being reviewed by our Loan Operations team'
      },
      under_review: {
        color: 'bg-purple-50 border-purple-200 text-purple-700',
        icon: Shield,
        label: 'KYC Under Review',
        description: 'Verification in progress. Estimated review time: 24-48 hours'
      },
      completed: {
        color: 'bg-green-50 border-green-200 text-green-700',
        icon: UserCheck,
        label: 'KYC Verified',
        description: 'Your identity has been verified. You are eligible for loans!'
      },
      rejected: {
        color: 'bg-red-50 border-red-200 text-red-700',
        icon: XCircle,
        label: 'KYC Action Required',
        description: profile?.kyc_rejection_reason || 'Please update your information and resubmit'
      }
    }
    return configs[status] || configs.not_started
  }

  const isEligibleForLoans = profile?.kyc_status === 'completed' && profile?.loan_eligibility_status === 'eligible'

  // Status badge colors for application
  const appStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-[#2563EB]/10 text-[#2563EB]',
      under_review: 'bg-[#6D28D9]/10 text-[#6D28D9]',
      collateral_required: 'bg-[#EAB308]/10 text-[#EAB308]',
      collateral_uploaded: 'bg-[#EAB308]/10 text-[#EAB308]',
      collateral_verified: 'bg-[#16A34A]/10 text-[#16A34A]',
      collateral_rejected: 'bg-[#DC2626]/10 text-[#DC2626]',
      approved: 'bg-[#16A34A]/10 text-[#16A34A]',
      rejected: 'bg-[#DC2626]/10 text-[#DC2626]',
      awaiting_disbursement: 'bg-[#6D28D9]/10 text-[#6D28D9]',
      disbursed: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
    }
    return colors[status] || 'bg-[#9CA3AF]/10 text-[#9CA3AF]'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <LoadingStats count={4} />
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200 mb-4" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-[#1F2937] px-3 py-2.5">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
                <div className="space-y-1">
                  <div className="h-5 w-8 animate-pulse rounded bg-gray-700" />
                  <div className="h-3 w-12 animate-pulse rounded bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <LoadingTable rows={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F9FAFB]">Welcome, {profile?.full_name || 'User'}!</h1>
        <p className="text-sm text-[#9CA3AF]">Your financial position at a glance</p>
      </div>

      {/* KYC Status Banner - Prominent and Actionable */}
      {profile && (
        <div className={`rounded-2xl border-2 p-6 ${getKYCStatusConfig(profile.kyc_status).color}`}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/50">
              {React.createElement(getKYCStatusConfig(profile.kyc_status).icon, { className: 'h-7 w-7' })}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-semibold">{getKYCStatusConfig(profile.kyc_status).label}</h3>
                {profile.kyc_status === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Eligible for Loans
                  </span>
                )}
                {profile.kyc_status === 'submitted' || profile.kyc_status === 'under_review' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                    <Clock className="h-3.5 w-3.5" />
                    Under Review
                  </span>
                )}
              </div>
              <p className="mt-2 text-base opacity-90">{getKYCStatusConfig(profile.kyc_status).description}</p>
              
              {/* Progress bar for in-progress KYC */}
              {profile.kyc_status === 'in_progress' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">Verification Progress</span>
                    <span className="font-bold">{profile.kyc_progress}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/50">
                    <div 
                      className="h-full bg-current transition-all duration-500" 
                      style={{ width: `${profile.kyc_progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Primary action button based on KYC status */}
              <div className="mt-4">
                {profile.kyc_status === 'not_started' && (
                  <Link
                    href="/kyc/onboarding"
                    className="inline-flex items-center gap-2 rounded-xl bg-current px-6 py-3 text-sm font-semibold text-white hover:opacity-90 shadow-lg"
                  >
                    Start KYC Verification <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {profile.kyc_status === 'in_progress' && (
                  <Link
                    href="/kyc/onboarding"
                    className="inline-flex items-center gap-2 rounded-xl bg-current px-6 py-3 text-sm font-semibold text-white hover:opacity-90 shadow-lg"
                  >
                    Continue KYC <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {profile.kyc_status === 'rejected' && (
                  <Link
                    href="/kyc/onboarding"
                    className="inline-flex items-center gap-2 rounded-xl bg-current px-6 py-3 text-sm font-semibold text-white hover:opacity-90 shadow-lg"
                  >
                    Resubmit KYC <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {profile.kyc_status === 'submitted' && (
                  <div className="rounded-lg bg-white/30 p-3 text-sm">
                    <p className="font-medium">Your KYC is under review</p>
                    <p className="text-xs opacity-80 mt-1">We'll notify you once verification is complete (typically 1-2 business days)</p>
                  </div>
                )}
                {profile.kyc_status === 'under_review' && (
                  <div className="rounded-lg bg-white/30 p-3 text-sm">
                    <p className="font-medium">Verification in progress</p>
                    <p className="text-xs opacity-80 mt-1">Our team is reviewing your documents. Estimated time: 24-48 hours</p>
                  </div>
                )}
                {profile.kyc_status === 'completed' && isEligibleForLoans && (
                  <Link
                    href="/dashboard/apply"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-6 py-3 text-sm font-semibold text-white hover:bg-[#5B21B6] shadow-lg shadow-purple-200"
                  >
                    Apply for Loan <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
              <Landmark className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF]">Active Loans</p>
              <p className="text-xl font-bold text-[#F9FAFB]">{totalActiveCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16A34A]/10">
              <Wallet className="h-5 w-5 text-[#16A34A]" />
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF]">Outstanding Balance</p>
              <p className="text-xl font-bold text-[#F9FAFB]">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6D28D9]/10">
              <Calendar className="h-5 w-5 text-[#6D28D9]" />
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF]">Next Repayment</p>
              <p className="text-xl font-bold text-[#F9FAFB]">
                {nextDueItem ? new Date(nextDueItem.due_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DC2626]/10">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF]">Overdue Payments</p>
              <p className="text-xl font-bold text-[#F9FAFB]">{statusSummary.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[#F9FAFB]">Loan Status Summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-2 rounded-lg bg-[#1F2937] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/10">
              <Clock className="h-4 w-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#F9FAFB]">{statusSummary.active}</p>
              <p className="text-[10px] text-[#9CA3AF]">Active</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#1F2937] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAB308]/10">
              <Clock className="h-4 w-4 text-[#EAB308]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#F9FAFB]">{statusSummary.pending}</p>
              <p className="text-[10px] text-[#9CA3AF]">In Progress</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#1F2937] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16A34A]/10">
              <CheckCircle className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#F9FAFB]">{statusSummary.completed}</p>
              <p className="text-[10px] text-[#9CA3AF]">Completed</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#1F2937] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DC2626]/10">
              <XCircle className="h-4 w-4 text-[#DC2626]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#F9FAFB]">{statusSummary.overdue}</p>
              <p className="text-[10px] text-[#9CA3AF]">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next repayment details */}
      {nextDueItem && (() => {
        const loan = loans.find(l => l.id === nextDueItem.loan_id)
        if (!loan) return null
        return (
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#F9FAFB]">Next Payment Due</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-[#9CA3AF]">
                  Loan: {formatCurrency(Number(loan.principal))} @ {loan.interest_rate}% interest
                </p>
                <p className="text-lg font-bold text-[#F9FAFB]">
                  Due: {new Date(nextDueItem.due_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-sm text-[#9CA3AF]">
                  Amount: <span className="font-semibold text-[#F9FAFB]">{formatCurrency(Number(nextDueItem.amount_due))}</span>
                </p>
              </div>
              <Link
                href="/dashboard/payments"
                className="inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6]"
              >
                Make Payment <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )
      })()}

      {/* Recent applications */}
      {applications.length > 0 && (
        <div className="rounded-xl border border-[#1F2937] bg-[#111827]">
          <div className="flex items-center justify-between border-b border-[#1F2937] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#F9FAFB]">Recent Applications</h2>
            <Link href="/dashboard/loans" className="text-xs text-[#6D28D9] hover:text-[#7C3AED]">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[#1F2937]">
            {applications.slice(0, 5).map((app) => (
              <div key={app.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-[#F9FAFB]">{formatCurrency(Number(app.amount))} - {app.purpose}</p>
                  <p className="text-xs text-[#9CA3AF]">{new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${appStatusColor(app.status)}`}>
                  {app.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {applications.length === 0 && loans.length === 0 && (
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-12 text-center">
          <Landmark className="mx-auto h-12 w-12 text-[#374151]" />
          <h3 className="mt-4 text-lg font-semibold text-[#F9FAFB]">Welcome to Rutha Credit Solutions</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {isEligibleForLoans 
              ? 'Apply for a loan to get started. Track your application status, upload collateral, make payments, and manage your loans — all in one place.'
              : 'Complete your KYC verification to unlock loan applications and access our financial services.'}
          </p>
          {isEligibleForLoans ? (
            <Link
              href="/dashboard/apply"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6]"
            >
              Apply Now <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/kyc/onboarding"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6]"
            >
              Complete KYC <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
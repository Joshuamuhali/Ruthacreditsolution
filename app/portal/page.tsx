'use client'

import { useEffect, useState, createElement } from 'react'
import { PortalAuthGuard } from '@/components/portal/auth-guard'
import { supabase } from '@/lib/supabase'
import { LoadingStats, LoadingTable } from '@/components/ui/loading'
import type { Loan, Application, Profile } from '@/lib/types'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Bell,
  ArrowRight,
  Upload,
  XCircle
} from 'lucide-react'

export default function PortalDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [apps, setApps] = useState<Application[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) setProfile(profileData)

      // Load applications
      const { data: appsData } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      setApps((appsData as Application[]) || [])

      // Load loans if any
      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      setLoans((loansData as Loan[]) || [])

      // Load notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setNotifications(notifData || [])

    } catch (err) {
      console.error('Dashboard load error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const latestApp = apps[0]
  const activeLoan = loans.find(l => l.status === 'active')

  // Get status config
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      submitted: {
        color: 'text-[#2563EB]',
        bg: 'bg-[#2563EB]/10 border-[#2563EB]/30',
        icon: FileText,
        label: 'SUBMITTED'
      },
      under_review: {
        color: 'text-[#6D28D9]',
        bg: 'bg-[#6D28D9]/10 border-[#6D28D9]/30',
        icon: Clock,
        label: 'UNDER REVIEW'
      },
      approved: {
        color: 'text-[#16A34A]',
        bg: 'bg-[#16A34A]/10 border-[#16A34A]/30',
        icon: CheckCircle,
        label: 'APPROVED'
      },
      rejected: {
        color: 'text-[#DC2626]',
        bg: 'bg-[#DC2626]/10 border-[#DC2626]/30',
        icon: XCircle,
        label: 'REJECTED'
      },
      disbursed: {
        color: 'text-[#2563EB]',
        bg: 'bg-[#2563EB]/10 border-[#2563EB]/30',
        icon: CheckCircle,
        label: 'FUNDED'
      }
    }
    return configs[status] || configs.submitted
  }

  const getTimelineSteps = (currentStatus: string) => {
    const steps = [
      { key: 'submitted', label: 'Submitted' },
      { key: 'under_review', label: 'Under Review' },
      { key: 'approved', label: 'Approved' },
      { key: 'disbursed', label: 'Funded' },
      { key: 'active', label: 'Active' }
    ]

    const currentIndex = steps.findIndex(s => s.key === currentStatus)
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }))
  }

  if (loading) {
    return (
      <PortalAuthGuard>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
          </div>
          <LoadingStats count={4} />
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-8">
            <div className="space-y-4">
              <div className="h-32 w-full animate-pulse rounded-lg bg-gray-700" />
              <div className="h-24 w-full animate-pulse rounded-lg bg-gray-700" />
            </div>
          </div>
        </div>
      </PortalAuthGuard>
    )
  }

  if (error) {
    return (
      <PortalAuthGuard>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-semibold text-[#F9FAFB]">Unable to Load Dashboard</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-4 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6]"
          >
            Retry
          </button>
        </div>
      </PortalAuthGuard>
    )
  }

  return (
    <PortalAuthGuard>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">
            Welcome Back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-[#9CA3AF]">Here's your loan application status</p>
        </div>

        {/* Empty State - No Applications */}
        {!latestApp && (
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-[#374151]" />
            <h3 className="mt-4 text-xl font-semibold text-[#F9FAFB]">No Loan Applications Yet</h3>
            <p className="mt-2 text-sm text-[#9CA3AF] max-w-md mx-auto">
              Start your financial journey today. Submit your first loan application and we'll guide you through every step.
            </p>
            <a
              href="/dashboard/apply"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] px-6 py-3 text-sm font-medium text-white hover:bg-[#5B21B6]"
            >
              Apply for Loan <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Application Dashboard */}
        {latestApp && (
          <>
            {/* Hero Status Card */}
            <div className={`rounded-xl border-2 p-6 ${getStatusConfig(latestApp.status).bg}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/50">
                    {createElement(getStatusConfig(latestApp.status).icon, { 
                      className: `h-7 w-7 ${getStatusConfig(latestApp.status).color}` 
                    })}
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${getStatusConfig(latestApp.status).color}`}>
                      {getStatusConfig(latestApp.status).label}
                    </h2>
                    <p className="mt-1 text-sm text-[#9CA3AF]">
                      Submitted: {new Date(latestApp.submitted_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="mt-1 text-sm text-[#9CA3AF]">
                      Requested Amount: <span className="font-semibold text-[#F9FAFB]">
                        ZMW {Number(latestApp.requested_amount).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
                <a
                  href="/dashboard/loans"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30"
                >
                  View Application <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Next Action Card */}
            <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
              <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">Next Steps</h3>
              <div className="mt-4">
                {latestApp.status === 'submitted' && (
                  <div>
                    <p className="text-base font-medium text-[#F9FAFB]">
                      Your application has been received
                    </p>
                    <p className="mt-2 text-sm text-[#9CA3AF]">
                      A Loan Officer will begin reviewing your application shortly. You'll be notified once the review starts.
                    </p>
                    <p className="mt-2 text-xs text-[#6B7280]">
                      Estimated review time: 1-3 business days
                    </p>
                  </div>
                )}
                {latestApp.status === 'under_review' && (
                  <div>
                    <p className="text-base font-medium text-[#F9FAFB]">
                      Your application is being reviewed
                    </p>
                    <p className="mt-2 text-sm text-[#9CA3AF]">
                      Our team is carefully reviewing your application. We may contact you if we need additional information.
                    </p>
                  </div>
                )}
                {latestApp.status === 'approved' && (
                  <div>
                    <p className="text-base font-medium text-[#16A34A]">
                      Congratulations! Your loan has been approved
                    </p>
                    <p className="mt-2 text-sm text-[#9CA3AF]">
                      Approved Amount: <span className="font-semibold text-[#F9FAFB]">
                        ZMW {Number(latestApp.requested_amount).toLocaleString()}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-[#9CA3AF]">
                      Awaiting disbursement. You'll be notified once funds are sent.
                    </p>
                  </div>
                )}
                {latestApp.status === 'rejected' && (
                  <div>
                    <p className="text-base font-medium text-[#DC2626]">
                      Application not approved
                    </p>
                    <p className="mt-2 text-sm text-[#9CA3AF]">
                      Unfortunately, your application was not approved at this time. You can submit a new application.
                    </p>
                    <a
                      href="/dashboard/apply"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6]"
                    >
                      New Application <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Loan Timeline */}
            <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
              <h3 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-6">
                Application Progress
              </h3>
              <div className="relative">
                <div className="absolute left-[19px] top-0 h-full w-0.5 bg-[#1F2937]" />
                <div className="space-y-6">
                  {getTimelineSteps(latestApp.status).map((step, i) => (
                    <div key={i} className="relative flex items-start gap-4">
                      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        step.completed ? 'bg-[#16A34A]/10' : 'bg-[#1F2937]'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                        ) : (
                          <div className="h-2.5 w-2.5 rounded-full bg-[#374151]" />
                        )}
                      </div>
                      <div className="pt-1.5">
                        <p className={`text-sm font-medium ${
                          step.completed ? 'text-[#16A34A]' : 'text-[#6B7280]'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* My Applications */}
            {apps.length > 0 && (
              <div className="rounded-xl border border-[#1F2937] bg-[#111827]">
                <div className="border-b border-[#1F2937] px-6 py-4">
                  <h3 className="text-sm font-semibold text-[#F9FAFB]">My Applications</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1F2937] bg-[#0B0F1A]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Application ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2937]">
                      {apps.slice(0, 5).map((app) => {
                        const statusConfig = getStatusConfig(app.status)
                        return (
                          <tr key={app.id} className="hover:bg-[#1F2937]/50">
                            <td className="px-4 py-3 text-sm font-medium text-[#F9FAFB]">
                              #{app.id.slice(0, 8)}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#9CA3AF]">
                              {new Date(app.submitted_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#F9FAFB]">
                              ZMW {Number(app.requested_amount).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Active Loan Card */}
            {activeLoan && (
              <div className="rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#16A34A] uppercase tracking-wider">
                      Active Loan
                    </h3>
                    <div className="mt-4 space-y-2">
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Loan ID</p>
                        <p className="text-sm font-medium text-[#F9FAFB]">
                          #{activeLoan.id.slice(0, 8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Remaining Balance</p>
                        <p className="text-lg font-bold text-[#F9FAFB]">
                          ZMW {Number(activeLoan.remaining_balance).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Next Due Date</p>
                        <p className="text-sm font-medium text-[#F9FAFB]">
                          {activeLoan.disbursed_at 
                            ? new Date(activeLoan.disbursed_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <a
                    href="/dashboard/payments"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-medium text-white hover:bg-[#15803D]"
                  >
                    Make Payment <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Notifications Panel */}
            {notifications.length > 0 && (
              <div className="rounded-xl border border-[#1F2937] bg-[#111827]">
                <div className="border-b border-[#1F2937] px-6 py-4">
                  <h3 className="text-sm font-semibold text-[#F9FAFB]">Recent Notifications</h3>
                </div>
                <div className="divide-y divide-[#1F2937]">
                  {notifications.slice(0, 4).map((notif) => (
                    <div key={notif.id} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6D28D9]/10">
                          <Bell className="h-4 w-4 text-[#6D28D9]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#F9FAFB]">{notif.title}</p>
                          <p className="mt-1 text-xs text-[#9CA3AF]">{notif.message}</p>
                          <p className="mt-1 text-[10px] text-[#6B7280]">
                            {new Date(notif.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PortalAuthGuard>
  )
}
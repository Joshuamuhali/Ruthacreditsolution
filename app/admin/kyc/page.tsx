'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle, Shield, Clock, User, Mail, Phone, FileText, Briefcase, RefreshCw, Search, Filter, ChevronDown } from 'lucide-react'
import type { Profile, KYCStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'

type KYCFilter = 'all' | 'submitted' | 'under_review' | 'completed' | 'rejected'

export default function AdminKYCReview() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [filter, setFilter] = useState<KYCFilter>('submitted')
  const [searchQuery, setSearchQuery] = useState('')
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      // Check if user is admin or loan_ops
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['admin', 'loan_ops'].includes(profile.role)) {
        router.push('/dashboard')
        return
      }

      setCurrentUser(profile)
      loadProfiles()
    }
    load()
  }, [router])

  async function loadProfiles() {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('*')
      .in('kyc_status', ['submitted', 'under_review', 'completed', 'rejected'])
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('kyc_status', filter)
    }

    const { data } = await query
    setProfiles((data as Profile[]) || [])
    setLoading(false)
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleApprove(profile: Profile) {
    if (!currentUser) return
    setProcessing(true)

    const { error } = await supabase.from('profiles').update({
      kyc_status: 'completed',
      kyc_verified_at: new Date().toISOString(),
      kyc_verified_by: currentUser.id,
      kyc_rejection_reason: null,
    }).eq('id', profile.id)

    if (error) {
      alert('Error approving KYC: ' + error.message)
    } else {
      await loadProfiles()
      setSelectedProfile(null)
    }
    setProcessing(false)
  }

  async function handleReject(profile: Profile) {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }
    if (!currentUser) return
    setProcessing(true)

    const { error } = await supabase.from('profiles').update({
      kyc_status: 'rejected',
      kyc_rejection_reason: rejectionReason,
    }).eq('id', profile.id)

    if (error) {
      alert('Error rejecting KYC: ' + error.message)
    } else {
      await loadProfiles()
      setSelectedProfile(null)
      setShowRejectModal(false)
      setRejectionReason('')
    }
    setProcessing(false)
  }

  async function handleUnderReview(profile: Profile) {
    setProcessing(true)

    const { error } = await supabase.from('profiles').update({
      kyc_status: 'under_review',
    }).eq('id', profile.id)

    if (error) {
      alert('Error updating status: ' + error.message)
    } else {
      await loadProfiles()
    }
    setProcessing(false)
  }

  const getStatusColor = (status: KYCStatus) => {
    const colors: Record<KYCStatus, string> = {
      not_started: 'bg-gray-50 border-gray-200 text-gray-700',
      in_progress: 'bg-blue-50 border-blue-200 text-blue-700',
      submitted: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      under_review: 'bg-purple-50 border-purple-200 text-purple-700',
      completed: 'bg-green-50 border-green-200 text-green-700',
      rejected: 'bg-red-50 border-red-200 text-red-700',
    }
    return colors[status]
  }

  const getStatusIcon = (status: KYCStatus) => {
    const icons: Record<KYCStatus, any> = {
      not_started: Clock,
      in_progress: RefreshCw,
      submitted: Clock,
      under_review: RefreshCw,
      completed: CheckCircle,
      rejected: XCircle,
    }
    return icons[status]
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KYC Review Queue</h1>
            <p className="text-sm text-gray-500">Review and verify customer identity documents</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profiles.length} Total</p>
              <p className="text-xs text-gray-500">{profiles.filter(p => p.kyc_status === 'submitted').length} Pending Review</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {!selectedProfile ? (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(['all', 'submitted', 'under_review', 'completed', 'rejected'] as KYCFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-[#6D28D9] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {f.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            {/* Profile List */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No KYC submissions found
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((profile) => (
                      <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-[#6D28D9] font-semibold">
                              {profile.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{profile.full_name}</p>
                              <p className="text-sm text-gray-500">{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(profile.kyc_status)}`}>
                            {(() => {
                              const Icon = getStatusIcon(profile.kyc_status)
                              return <Icon className="h-3 w-3" />
                            })()}
                            {profile.kyc_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full bg-[#6D28D9] transition-all"
                                style={{ width: `${profile.kyc_progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{profile.kyc_progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedProfile(profile)}
                            className="rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6] transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* Detail View */}
            <div className="mb-4">
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to queue
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-[#6D28D9] text-xl font-semibold">
                        {selectedProfile.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedProfile.full_name}</h2>
                        <p className="text-sm text-gray-500">{selectedProfile.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${getStatusColor(selectedProfile.kyc_status)}`}>
                      {(() => {
                        const Icon = getStatusIcon(selectedProfile.kyc_status)
                        return <Icon className="h-4 w-4" />
                      })()}
                      {selectedProfile.kyc_status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedProfile.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{selectedProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedProfile.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Employment</p>
                        <p className="text-sm font-medium text-gray-900">{selectedProfile.employment_info || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {selectedProfile.business_info && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500 mb-1">Business Details</p>
                      <p className="text-sm text-gray-900">{selectedProfile.business_info}</p>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">Uploaded Documents</h3>
                  {selectedProfile.national_id_url ? (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">National ID / Passport</p>
                        <a
                          href={selectedProfile.national_id_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#6D28D9] hover:underline"
                        >
                          View document
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No documents uploaded</p>
                  )}
                </div>

                {/* Rejection History */}
                {selectedProfile.kyc_status === 'rejected' && selectedProfile.kyc_rejection_reason && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <h3 className="mb-2 font-semibold text-red-900">Rejection Reason</h3>
                    <p className="text-sm text-red-700">{selectedProfile.kyc_rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">Review Actions</h3>
                  <div className="space-y-3">
                    {selectedProfile.kyc_status === 'submitted' && (
                      <button
                        onClick={() => handleUnderReview(selectedProfile)}
                        disabled={processing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Start Review
                      </button>
                    )}
                    {selectedProfile.kyc_status === 'under_review' && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedProfile)}
                          disabled={processing}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {processing ? 'Processing...' : 'Approve KYC'}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={processing}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject KYC
                        </button>
                      </>
                    )}
                    {selectedProfile.kyc_status === 'rejected' && (
                      <button
                        onClick={() => handleUnderReview(selectedProfile)}
                        disabled={processing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Re-submit for Review
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">Verification Timeline</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Submitted</span>
                      <span className="text-gray-900">{new Date(selectedProfile.created_at).toLocaleDateString()}</span>
                    </div>
                    {selectedProfile.kyc_verified_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Verified</span>
                        <span className="text-gray-900">{new Date(selectedProfile.kyc_verified_at).toLocaleDateString()}</span>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Reject KYC Submission</h3>
                  <p className="mb-4 text-sm text-gray-500">Please provide a reason for rejection. This will be shared with the customer.</p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-purple-100"
                    placeholder="e.g. National ID is unclear, proof of income missing, information mismatch..."
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        setShowRejectModal(false)
                        setRejectionReason('')
                      }}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(selectedProfile)}
                      disabled={processing || !rejectionReason.trim()}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

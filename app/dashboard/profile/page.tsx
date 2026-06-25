'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Upload, X, Loader2 } from 'lucide-react'
import { LoadingSpinner, LoadingCard } from '@/components/ui/loading'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Editable fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [employmentInfo, setEmploymentInfo] = useState('')
  const [businessInfo, setBusinessInfo] = useState('')
  const [kycStatus, setKycStatus] = useState('pending')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
      setFullName(data.full_name || '')
      setPhone(data.phone || '')
      setEmploymentInfo(data.employment_info || '')
      setBusinessInfo(data.business_info || '')
      setKycStatus(data.kyc_status || 'pending')
    }

    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        employment_info: employmentInfo || null,
        business_info: businessInfo || null,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('Profile updated successfully')
      setProfile((prev) => prev ? { ...prev, full_name: fullName, phone } : prev)
    }

    setSaving(false)
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const kycStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-[#EAB308]/10 text-[#EAB308]',
      submitted: 'bg-[#2563EB]/10 text-[#2563EB]',
      verified: 'bg-[#16A34A]/10 text-[#16A34A]',
      rejected: 'bg-[#DC2626]/10 text-[#DC2626]',
    }
    return colors[status] || 'bg-[#9CA3AF]/10 text-[#9CA3AF]'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <LoadingCard />
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-700 mb-4" />
          <div className="space-y-4">
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-700" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-700" />
            <div className="h-20 w-full animate-pulse rounded-lg bg-gray-700" />
            <div className="h-20 w-full animate-pulse rounded-lg bg-gray-700" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F9FAFB]">My Profile</h1>
        <p className="text-sm text-[#9CA3AF]">Manage your personal information and KYC status</p>
      </div>

      {profile && (
        <>
          {/* KYC Status Card */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6D28D9] text-2xl font-bold text-white">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#F9FAFB]">{profile.full_name}</h2>
                  <p className="text-sm text-[#9CA3AF]">{profile.email}</p>
                  <p className="text-xs text-[#6B7280]">Member since {formatDate(profile.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">KYC:</span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${kycStatusBadge(kycStatus)}`}>
                  {kycStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-[#1F2937] bg-[#111827] p-5">
            <h2 className="text-sm font-semibold text-[#F9FAFB]">Personal Details</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-sm text-[#6B7280] outline-none cursor-not-allowed"
                />
                <p className="mt-0.5 text-[10px] text-[#6B7280]">Email cannot be changed</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9]"
                placeholder="+260 XXX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">Employment / Business Information</label>
              <textarea
                value={employmentInfo}
                onChange={(e) => setEmploymentInfo(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9] resize-none"
                placeholder="e.g. Employed at XYZ Company, Manager"
              />
            </div>

            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">Business Details (if self-employed)</label>
              <textarea
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9] resize-none"
                placeholder="e.g. Small retail business, operating for 3 years"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-[#DC2626]/10 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-[#DC2626]" />
                <p className="text-sm text-[#DC2626]">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-[#16A34A]/10 px-3 py-2">
                <CheckCircle className="h-4 w-4 text-[#16A34A]" />
                <p className="text-sm text-[#16A34A]">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6] disabled:opacity-50 sm:w-auto"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Account Info */}
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
            <h2 className="text-sm font-semibold text-[#F9FAFB]">Account Information</h2>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">User ID</span>
                <span className="text-[#F9FAFB] font-mono text-xs">{profile.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Role</span>
                <span className="text-[#F9FAFB] capitalize">{profile.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">KYC Status</span>
                <span className={`capitalize ${kycStatus === 'verified' ? 'text-[#16A34A]' : kycStatus === 'rejected' ? 'text-[#DC2626]' : 'text-[#EAB308]'}`}>
                  {kycStatus}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Support */}
      <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
        <h2 className="text-sm font-semibold text-[#F9FAFB]">Need Help?</h2>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Contact our support team for assistance with your account or KYC verification.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="mailto:support@ruthacredit.com"
            className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs font-medium text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
          >
            Email Support
          </a>
          <a
            href="#"
            className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs font-medium text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
          >
            WhatsApp
          </a>
          <a
            href="#"
            className="rounded-lg border border-[#1F2937] px-4 py-2 text-xs font-medium text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
          >
            Live Chat
          </a>
        </div>
      </div>
    </div>
  )
}
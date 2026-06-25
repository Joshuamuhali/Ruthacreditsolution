'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, XCircle, Mail, RefreshCw } from 'lucide-react'

export default function KYCReview() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .single()

      if (!profile || profile.kyc_status !== 'rejected') {
        router.push('/kyc/onboarding')
        return
      }

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F1A] px-4">
      <div className="w-full max-w-md rounded-xl border border-[#DC2626]/30 bg-[#111827] p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-[#DC2626]" />
        <h1 className="mt-4 text-xl font-bold text-[#F9FAFB]">KYC Verification Rejected</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">
          Your submitted documents could not be verified. This may be due to unclear images or incomplete information.
        </p>

        <div className="mt-6 rounded-lg bg-[#1F2937] p-4 text-left">
          <h3 className="text-sm font-medium text-[#F9FAFB]">What to do next:</h3>
          <ul className="mt-2 space-y-1.5 text-xs text-[#9CA3AF]">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#DC2626]">•</span>
              Ensure uploaded documents are clear and legible
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#DC2626]">•</span>
              Verify your name matches your official ID
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#DC2626]">•</span>
              Contact support if you believe this is an error
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => router.push('/kyc/onboarding')}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6]"
          >
            <RefreshCw className="h-4 w-4" />
            Re-submit KYC
          </button>
          <a
            href="mailto:support@ruthacredit.com"
            className="flex items-center justify-center gap-2 rounded-lg border border-[#1F2937] px-5 py-2.5 text-sm font-medium text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
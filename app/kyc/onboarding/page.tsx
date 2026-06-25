'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, X, Upload, Shield, Phone, Briefcase, FileText, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type KYCStep = 'identity' | 'contact' | 'employment' | 'documents' | 'review'

const TOTAL_STEPS = 5

export default function KYCOboarding() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeStep, setActiveStep] = useState<KYCStep>('identity')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [profileId, setProfileId] = useState<string | null>(null)
  const [kycProgress, setKycProgress] = useState(0)

  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState('employed')
  const [incomeRange, setIncomeRange] = useState('')
  const [businessInfo, setBusinessInfo] = useState('')
  const [files, setFiles] = useState<{ idDoc: File | null; incomeDoc: File | null }>({ idDoc: null, incomeDoc: null })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) { router.push('/auth'); return }
      if (profile.kyc_status === 'completed') { router.push('/dashboard'); return }

      setProfileId(profile.id)
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')

      let progress = 0
      if (profile.full_name) progress += 20
      if (profile.phone) progress += 20
      setKycProgress(progress)
      setLoading(false)
    }
    load()
  }, [router])

  const stepStatus = (step: KYCStep) => {
    const order: KYCStep[] = ['identity', 'contact', 'employment', 'documents', 'review']
    const idx = order.indexOf(activeStep)
    const si = order.indexOf(step)
    if (si < idx) return 'complete'
    if (si === idx) return 'active'
    return 'locked'
  }

  const steps = [
    { key: 'identity' as KYCStep, label: 'Identity', icon: Shield },
    { key: 'contact' as KYCStep, label: 'Contact', icon: Phone },
    { key: 'employment' as KYCStep, label: 'Income', icon: Briefcase },
    { key: 'documents' as KYCStep, label: 'Documents', icon: FileText },
    { key: 'review' as KYCStep, label: 'Submit', icon: CheckCircle },
  ]

  const progressPercent = Math.min(100, kycProgress)

  async function handleNext() {
    const order: KYCStep[] = ['identity', 'contact', 'employment', 'documents', 'review']
    const currentIndex = order.indexOf(activeStep)

    if (activeStep === 'identity' && !fullName) { setError('Please enter your full name'); return }
    if (activeStep === 'contact' && !phone) { setError('Please enter your phone number'); return }
    if (activeStep === 'employment' && !incomeRange) { setError('Please select your income range'); return }
    setError('')

    if (profileId) {
      const updates: any = {}
      if (activeStep === 'identity') { updates.full_name = fullName; setKycProgress(Math.max(kycProgress, 20)) }
      if (activeStep === 'contact') { updates.phone = phone; setKycProgress(Math.max(kycProgress, 40)) }
      if (activeStep === 'employment') { updates.employment_info = `${employmentStatus} - ${incomeRange}${businessInfo ? ` (${businessInfo})` : ''}`; setKycProgress(Math.max(kycProgress, 60)) }
      if (activeStep === 'documents') { setKycProgress(Math.max(kycProgress, 80)) }
      updates.kyc_status = 'in_progress'
      await supabase.from('profiles').update(updates).eq('id', profileId)
    }

    if (currentIndex < order.length - 1) setActiveStep(order[currentIndex + 1])
  }

  async function handleSubmit() {
    if (!profileId) return
    setSaving(true); setError('')

    let idDocUrl = '', incomeDocUrl = ''
    if (files.idDoc) {
      const { data: upData } = await supabase.storage.from('kyc-documents').upload(`${profileId}/id-${Date.now()}`, files.idDoc)
      if (upData) { const { data: pubUrl } = supabase.storage.from('kyc-documents').getPublicUrl(upData.path); if (pubUrl) idDocUrl = pubUrl.publicUrl }
    }
    if (files.incomeDoc) {
      const { data: upData } = await supabase.storage.from('kyc-documents').upload(`${profileId}/income-${Date.now()}`, files.incomeDoc)
      if (upData) { const { data: pubUrl } = supabase.storage.from('kyc-documents').getPublicUrl(upData.path); if (pubUrl) incomeDocUrl = pubUrl.publicUrl }
    }

    const { error: updateError } = await supabase.from('profiles').update({
      full_name: fullName, phone,
      employment_info: `${employmentStatus} - ${incomeRange}`,
      business_info: businessInfo || null,
      national_id_url: idDocUrl || null,
      kyc_status: 'submitted',
      kyc_progress: 100,
      loan_eligibility_status: 'not_eligible',
    }).eq('id', profileId)

    if (updateError) { setError(updateError.message); setSaving(false); return }
    setSubmitted(true); setSaving(false)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50"><Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" /></div>
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-xl shadow-purple-100">
          <RefreshCw className="mx-auto h-14 w-14 animate-spin text-[#6D28D9]" />
          <h1 className="mt-5 text-xl font-bold text-gray-900">KYC Submitted for Review</h1>
          <p className="mt-2 text-sm text-gray-500">Your documents are being verified by our Loan Operations team. This usually takes 24-48 hours.</p>
          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-amber-700">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Verification in progress
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">You'll be notified once verified and eligible for loans.</p>
          <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-200 hover:shadow-xl transition-all">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6D28D9] to-[#4C1D95]">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Rutha Credit Solutions</span>
          </div>
          <div className="text-xs text-gray-400 font-medium">Step {steps.findIndex(s => s.key === activeStep) + 1} of {TOTAL_STEPS}</div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-gray-500">Verify your identity to unlock loan applications</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">KYC Progress</span>
            <span className="text-xs font-semibold text-[#6D28D9]">{kycProgress}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100">
            <div className="h-3 rounded-full bg-gradient-to-r from-[#6D28D9] to-[#16A34A] transition-all duration-500 shadow-sm" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Step Tabs */}
        <div className="mb-8 grid grid-cols-5 gap-2">
          {steps.map((step) => {
            const st = stepStatus(step.key)
            const Icon = step.icon
            return (
              <div key={step.key} className={`rounded-xl border-2 p-3 text-center transition-all ${
                st === 'active' ? 'border-[#6D28D9] bg-purple-50 shadow-sm' :
                st === 'complete' ? 'border-emerald-200 bg-emerald-50' :
                'border-gray-100 bg-white opacity-60'
              }`}>
                <div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full ${
                  st === 'complete' ? 'bg-emerald-100 text-emerald-600' :
                  st === 'active' ? 'bg-purple-100 text-[#6D28D9]' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {st === 'complete' ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <p className="text-[10px] font-medium text-gray-500">{step.label}</p>
              </div>
            )
          })}
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          {/* Identity */}
          {activeStep === 'identity' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9]"><Shield className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-semibold text-gray-900">Identity Verification</h2><p className="text-xs text-gray-400">Step 1 of 5 — Let's confirm who you are</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-purple-100 focus:bg-white" placeholder="Enter your full legal name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">National ID Number</label>
                  <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-purple-100 focus:bg-white" placeholder="e.g. 123456/78/1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                  <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-purple-100 focus:bg-white" />
                </div>
              </div>
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-4">
                <p className="text-xs text-purple-600"><Shield className="mr-1 inline h-3 w-3" /> Your identity data is encrypted and used only for verification.</p>
              </div>
              <button onClick={handleNext} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Contact */}
          {activeStep === 'contact' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9]"><Phone className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-semibold text-gray-900">Contact Verification</h2><p className="text-xs text-gray-400">Step 2 of 5 — How to reach you</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-purple-100 focus:bg-white" placeholder="+260 XXX XXX XXX" required />
                  <p className="mt-1 text-xs text-gray-400">Used for loan updates and payment reminders</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /><span className="text-xs text-emerald-700">Email verified ✓</span></div>
                </div>
              </div>
              <button onClick={handleNext} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Employment */}
          {activeStep === 'employment' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9]"><Briefcase className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-semibold text-gray-900">Employment & Income</h2><p className="text-xs text-gray-400">Step 3 of 5 — Tell us about your income</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment Status</label>
                  <select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-purple-100">
                    <option value="employed">Employed (Full-time)</option>
                    <option value="part-time">Employed (Part-time)</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="business">Business Owner</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Income (ZMW)</label>
                  <select value={incomeRange} onChange={(e) => setIncomeRange(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-purple-100" required>
                    <option value="">Select range</option>
                    <option value="0-2000">ZMW 0 - 2,000</option>
                    <option value="2001-5000">ZMW 2,001 - 5,000</option>
                    <option value="5001-10000">ZMW 5,001 - 10,000</option>
                    <option value="10001-20000">ZMW 10,001 - 20,000</option>
                    <option value="20001-50000">ZMW 20,001 - 50,000</option>
                    <option value="50000+">ZMW 50,000+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Details (if applicable)</label>
                  <textarea value={businessInfo} onChange={(e) => setBusinessInfo(e.target.value)} rows={2}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#6D28D9] focus:ring-2 focus:ring-purple-100 focus:bg-white" placeholder="e.g. Retail shop, operating for 2 years" />
                </div>
              </div>
              <button onClick={handleNext} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Documents */}
          {activeStep === 'documents' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9]"><FileText className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-semibold text-gray-900">Document Upload</h2><p className="text-xs text-gray-400">Step 4 of 5 — Upload supporting documents</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">National ID / Passport</label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500 hover:border-purple-300 hover:bg-purple-50 transition-all">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span>{files.idDoc ? files.idDoc.name : 'Upload your ID document'}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { if (e.target.files?.[0]) setFiles(p => ({ ...p, idDoc: e.target.files![0] })) }} className="hidden" />
                  </label>
                  {files.idDoc && <button onClick={() => setFiles(p => ({ ...p, idDoc: null }))} className="text-xs text-red-500 hover:text-red-600">Remove file</button>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Proof of Income / Payslip</label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500 hover:border-purple-300 hover:bg-purple-50 transition-all">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span>{files.incomeDoc ? files.incomeDoc.name : 'Upload payslip or bank statement'}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { if (e.target.files?.[0]) setFiles(p => ({ ...p, incomeDoc: e.target.files![0] })) }} className="hidden" />
                  </label>
                  {files.incomeDoc && <button onClick={() => setFiles(p => ({ ...p, incomeDoc: null }))} className="text-xs text-red-500 hover:text-red-600">Remove file</button>}
                  <p className="mt-1.5 text-xs text-gray-400">Accepted: PDF, JPG, PNG. Max 5MB each.</p>
                </div>
              </div>
              <button onClick={handleNext} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-0.5">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Review */}
          {activeStep === 'review' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2><p className="text-xs text-gray-400">Step 5 of 5 — Final review</p></div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 divide-y divide-gray-200">
                {[
                  ['Full Name', fullName],
                  ['National ID', nationalId || 'Not provided'],
                  ['Phone', phone || 'Not provided'],
                  ['Employment', `${employmentStatus} - ${incomeRange}`],
                  ['ID Document', files.idDoc ? 'Uploaded ✓' : 'Not uploaded'],
                  ['Income Proof', files.incomeDoc ? 'Uploaded ✓' : 'Not uploaded'],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between px-5 py-3">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
              {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
              <button onClick={handleSubmit} disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Submitting...' : 'Submit KYC for Verification'}
              </button>
              <p className="text-center text-xs text-gray-400">Verification typically takes 1-2 business days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
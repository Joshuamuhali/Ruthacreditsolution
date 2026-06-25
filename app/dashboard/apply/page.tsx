'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle, Upload, X, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type AppStage = 'form' | 'submitting' | 'assessment' | 'complete'

export default function ApplyLoanPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [termMonths, setTermMonths] = useState('12')
  const [notes, setNotes] = useState('')
  const [documents, setDocuments] = useState<File[]>([])
  const [stage, setStage] = useState<AppStage>('form')
  const [error, setError] = useState('')
  const [submittedApp, setSubmittedApp] = useState<any>(null)
  const [assessmentStep, setAssessmentStep] = useState(0)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Loan calculator
  const [showCalculator, setShowCalculator] = useState(false)
  const interestRate = 15
  const estimatedInterest = Number(amount) * (interestRate / 100)
  const estimatedTotal = Number(amount) + estimatedInterest
  const estimatedMonthly = termMonths ? estimatedTotal / Number(termMonths) : 0

  const assessmentSteps = [
    'Validating application',
    'Checking repayment capacity',
    'Finalizing review queue',
  ]

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (data) setFullName(data.full_name)
      setLoadingProfile(false)
    }
    loadProfile()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in'); return }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid loan amount'); return }

    setStage('submitting')

    // Upload docs
    let documentUrls: string[] = []
    if (documents.length > 0) {
      for (const file of documents) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { data: uploadData } = await supabase.storage.from('loan-documents').upload(fileName, file)
        if (uploadData) {
          const { data: pubUrl } = supabase.storage.from('loan-documents').getPublicUrl(uploadData.path)
          if (pubUrl) documentUrls.push(pubUrl.publicUrl)
        }
      }
    }

    const { data, error: insertError } = await supabase
      .from('loan_applications')
      .insert({
        user_id: user.id,
        full_name: fullName,
        amount: parsedAmount,
        purpose,
        term_months: parseInt(termMonths),
        notes: notes || null,
        document_urls: documentUrls.length > 0 ? documentUrls : null,
        status: 'submitted',
        assessment_status: 'processing',
      })
      .select()
      .single()

    if (insertError) { setError(insertError.message); setStage('form'); return }

    setSubmittedApp(data)

    // Log event + notify
    await supabase.from('loan_events').insert({
      application_id: data.id, event_type: 'application_submitted',
      metadata: { amount: parsedAmount, purpose, term_months: parseInt(termMonths) }, created_by: user.id,
    })
    await supabase.from('notifications').insert({
      user_id: user.id, title: 'Application Submitted',
      message: `Your loan application for ZMW ${parsedAmount.toLocaleString()} has been submitted and is being reviewed.`,
      type: 'system',
    })

    // Simulate assessment
    setStage('assessment')
    for (let i = 0; i < assessmentSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
      setAssessmentStep(i + 1)
    }

    // Move to under_review after assessment
    await supabase.from('loan_applications').update({ assessment_status: 'completed', status: 'under_review' }).eq('id', data.id)
    await supabase.from('loan_events').insert({
      application_id: data.id, event_type: 'review_started',
      metadata: { assessment_status: 'completed' }, created_by: user.id,
    })
    await supabase.from('notifications').insert({
      user_id: user.id, title: 'Application Under Review',
      message: 'Your application has passed initial checks and is now under review by our loan officers.',
      type: 'system',
    })

    setSubmittedApp((prev: any) => ({ ...prev, status: 'under_review' }))
    setStage('complete')
  }

  function addDocument(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setDocuments((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 5))
  }
  function removeDocument(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  // ===== ASSESSMENT SCREEN =====
  if (stage === 'assessment') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-full max-w-md rounded-xl border border-[#1F2937] bg-[#111827] p-8 text-center">
          <RefreshCw className="mx-auto h-10 w-10 animate-spin text-[#6D28D9]" />
          <h2 className="mt-4 text-lg font-semibold text-[#F9FAFB]">Evaluating Your Application</h2>
          <p className="mt-1 text-sm text-[#9CA3AF]">Running credit checks and preparing assessment</p>

          <div className="mt-6 space-y-3">
            {assessmentSteps.map((label, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-[#1F2937] px-4 py-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  i < assessmentStep ? 'bg-[#16A34A]/10' : i === assessmentStep ? 'bg-[#6D28D9]' : 'bg-[#374151]'
                }`}>
                  {i < assessmentStep ? (
                    <CheckCircle className="h-4 w-4 text-[#16A34A]" />
                  ) : i === assessmentStep ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-[#6B7280]" />
                  )}
                </div>
                <span className={`text-sm ${i <= assessmentStep ? 'text-[#F9FAFB]' : 'text-[#6B7280]'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ===== SUCCESS SCREEN =====
  if (stage === 'complete' && submittedApp) {
    const allStatusSteps = [
      { label: 'Submitted', done: true },
      { label: 'Under Review', done: submittedApp.status !== 'submitted' },
      { label: 'Collateral', done: false },
      { label: 'Approval', done: false },
      { label: 'Disbursement', done: false },
    ]

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Application Submitted</h1>
          <p className="text-sm text-[#9CA3AF]">Your loan application has been received and is being evaluated</p>
        </div>

        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-[#16A34A]" />
            <div>
              <p className="text-lg font-semibold text-[#F9FAFB]">Application #{submittedApp.id.slice(0, 8)}</p>
              <p className="text-sm text-[#9CA3AF]">
                ZMW {Number(submittedApp.amount).toLocaleString()} | {submittedApp.term_months} months | {submittedApp.purpose}
              </p>
            </div>
          </div>
        </div>

        {/* Full lifecycle tracker */}
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[#F9FAFB]">Application Progress</h2>
          <div className="relative">
            <div className="absolute left-[19px] top-0 h-full w-0.5 bg-[#1F2937]" />
            <div className="space-y-6">
              {allStatusSteps.map((step, i) => (
                <div key={i} className="relative flex items-start gap-4">
                  <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    step.done ? 'bg-[#16A34A]/10' : 'bg-[#1F2937]'
                  }`}>
                    {step.done ? (
                      <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#374151]" />
                    )}
                  </div>
                  <div className="pt-1.5">
                    <p className={`text-sm font-medium ${step.done ? 'text-[#16A34A]' : 'text-[#6B7280]'}`}>{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard" className="rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6]">Back to Dashboard</Link>
          <Link href="/dashboard/loans" className="rounded-lg border border-[#1F2937] px-5 py-2.5 text-sm font-medium text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]">Track Application</Link>
        </div>
      </div>
    )
  }

  // ===== LOADING SCREEN =====
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#6D28D9] border-t-transparent" />
          <p className="text-sm text-[#9CA3AF]">Loading application form...</p>
        </div>
      </div>
    )
  }

  // ===== FORM SCREEN =====
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F9FAFB]">Apply for a Loan</h1>
        <p className="text-sm text-[#9CA3AF]">Complete the form below to submit your loan application</p>
      </div>

      {/* Loan Calculator */}
      <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#111827]">
        <button onClick={() => setShowCalculator(!showCalculator)} className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-[#F9FAFB] hover:bg-[#1F2937]">
          <span>Loan Calculator (Preview)</span>
          <span className="text-[#6D28D9]">{showCalculator ? 'Hide' : 'Show'}</span>
        </button>
        {showCalculator && (
          <div className="border-t border-[#1F2937] p-5">
            <p className="mb-3 text-xs text-[#9CA3AF]">Adjust the amount and term below to see estimated repayments</p>
            {Number(amount) > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-[#1F2937] p-3">
                <div className="text-center">
                  <p className="text-[10px] text-[#9CA3AF]">Interest ({interestRate}%)</p>
                  <p className="text-sm font-semibold text-[#F9FAFB]">ZMW {estimatedInterest.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#9CA3AF]">Total Repayable</p>
                  <p className="text-sm font-semibold text-[#F9FAFB]">ZMW {estimatedTotal.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#9CA3AF]">Monthly</p>
                  <p className="text-sm font-semibold text-[#F9FAFB]">ZMW {Math.round(estimatedMonthly).toLocaleString()}</p>
                </div>
              </div>
            )}
            <p className="text-[10px] text-[#6B7280]">* Estimated at {interestRate}% p.a. interest. Actual rate may vary based on credit assessment.</p>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[#1F2937] bg-[#111827] p-5">
        <h2 className="text-sm font-semibold text-[#F9FAFB]">Application Details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-[#9CA3AF]">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#9CA3AF]">Loan Amount (ZMW)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000" min="100"
              className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9]" required />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#9CA3AF]">Loan Purpose</label>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)}
            className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]" required>
            <option value="">Select purpose</option>
            <option value="Business Expansion">Business Expansion</option>
            <option value="Personal">Personal</option>
            <option value="Education">Education</option>
            <option value="Medical">Medical</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Emergency">Emergency</option>
            <option value="Debt Consolidation">Debt Consolidation</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#9CA3AF]">Repayment Period</label>
          <select value={termMonths} onChange={(e) => setTermMonths(e.target.value)}
            className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]" required>
            {[3, 6, 9, 12, 18, 24].map((m) => (<option key={m} value={m}>{m} months</option>))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[#9CA3AF]">Additional Notes (Optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full resize-none rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9]"
            placeholder="Any additional information..." />
        </div>

        {/* Document Upload */}
        <div>
          <label className="mb-1 block text-xs text-[#9CA3AF]">Upload Documents (Optional)</label>
          <p className="mb-2 text-[10px] text-[#6B7280]">ID, payslip, business proof, or supporting documents</p>
          {documents.length > 0 && (
            <div className="mb-2 space-y-1">
              {documents.map((file, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-[#1F2937] px-3 py-1.5">
                  <span className="max-w-[250px] truncate text-xs text-[#9CA3AF]">{file.name}</span>
                  <button type="button" onClick={() => removeDocument(i)} className="text-[#DC2626] hover:text-[#EF4444]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#374151] bg-[#1F2937] px-4 py-3 text-sm text-[#9CA3AF] hover:border-[#6D28D9] hover:text-[#6D28D9]">
            <Upload className="h-4 w-4" />
            {documents.length > 0 ? 'Add more files' : 'Choose files'}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={addDocument} className="hidden" multiple />
          </label>
          <p className="mt-1 text-[10px] text-[#6B7280]">Max 5 files. Accepted: PDF, JPG, PNG, DOC</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[#DC2626]/10 px-3 py-2">
            <AlertCircle className="h-4 w-4 text-[#DC2626]" />
            <p className="text-sm text-[#DC2626]">{error}</p>
          </div>
        )}

        <button type="submit" disabled={stage === 'submitting'}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6] disabled:opacity-50">
          {stage === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {stage === 'submitting' ? 'Submitting...' : 'Submit Application'}
        </button>

        <div className="rounded-lg bg-[#1F2937] p-3">
          <p className="text-xs text-[#9CA3AF]">
            <strong className="text-[#F9FAFB]">Terms:</strong> By submitting, you agree to our{' '}
            <a href="/terms" className="text-[#6D28D9] hover:underline">Terms & Conditions</a>. A credit assessment will be performed. Loans subject to approval.
          </p>
        </div>
      </form>
    </div>
  )
}
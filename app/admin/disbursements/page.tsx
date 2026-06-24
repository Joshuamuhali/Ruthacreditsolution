'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/auth-guard'
import { supabase } from '@/lib/supabase'
import { createAuditLog, getCurrentProfile } from '@/lib/auth'
import { Loader2, Plus, Wallet } from 'lucide-react'
import type { Disbursement, Loan, Profile } from '@/lib/types'

export default function DisbursementsPage() {
  const [disb, setDisb] = useState<Disbursement[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ loan_id: '', transaction_id: '', reference_number: '', amount_sent: '', date_sent: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCurrentProfile().then(setProfile)
    loadData()
  }, [])

  async function loadData() {
    const [d, l] = await Promise.all([
      supabase.from('disbursements').select('*').order('confirmed_at', { ascending: false }),
      supabase.from('loans').select('*').eq('status', 'approved'),
    ])
    setDisb((d.data as Disbursement[]) || [])
    setLoans((l.data as Loan[]) || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)

    const { error } = await supabase.from('disbursements').insert({
      loan_id: form.loan_id,
      transaction_id: form.transaction_id,
      reference_number: form.reference_number,
      amount_sent: Number(form.amount_sent),
      date_sent: form.date_sent,
      confirmed_by: profile.id,
    })

    if (!error) {
      await supabase.from('loans').update({ status: 'funded' }).eq('id', form.loan_id)
      await createAuditLog(profile.id, profile.full_name, 'Disbursement recorded', 'disbursement', form.loan_id)
      setShowForm(false)
      setForm({ loan_id: '', transaction_id: '', reference_number: '', amount_sent: '', date_sent: '' })
      loadData()
    }
    setSubmitting(false)
  }

  return (
    <AdminAuthGuard allowedRoles={['admin', 'loan_ops']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F9FAFB]">Disbursements</h1>
            <p className="text-sm text-[#9CA3AF]">Record manual fund releases</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6]"
          >
            <Plus className="h-4 w-4" />
            Record Disbursement
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[#F9FAFB]">New Disbursement</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Approved Loan</label>
                <select
                  value={form.loan_id}
                  onChange={(e) => setForm({ ...form, loan_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]"
                  required
                >
                  <option value="">Select loan</option>
                  {loans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id.slice(0, 8)}... - ZMW {Number(l.approved_amount).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Transaction ID</label>
                <input
                  type="text"
                  value={form.transaction_id}
                  onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Reference Number</label>
                <input
                  type="text"
                  value={form.reference_number}
                  onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Amount Sent (ZMW)</label>
                <input
                  type="number"
                  value={form.amount_sent}
                  onChange={(e) => setForm({ ...form, amount_sent: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Date Sent</label>
                <input
                  type="date"
                  value={form.date_sent}
                  onChange={(e) => setForm({ ...form, date_sent: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Disbursement'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-[#374151] px-4 py-2 text-sm font-medium text-[#9CA3AF] hover:bg-[#1F2937]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#6D28D9]" /></div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#1F2937]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#111827]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF]">Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {disb.map((d) => (
                  <tr key={d.id} className="border-b border-[#1F2937] hover:bg-[#111827]/50">
                    <td className="px-4 py-3 text-sm text-[#F9FAFB]">{d.transaction_id}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{d.reference_number}</td>
                    <td className="px-4 py-3 text-sm text-[#F9FAFB]">ZMW {Number(d.amount_sent).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{new Date(d.date_sent).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right text-sm text-[#9CA3AF]">{new Date(d.confirmed_at).toLocaleString()}</td>
                  </tr>
                ))}
                {disb.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-[#6B7280]">
                      <Wallet className="mx-auto mb-2 h-8 w-8 text-[#374151]" />
                      No disbursements recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  )
}
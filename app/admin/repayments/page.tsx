'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/admin/auth-guard'
import { supabase } from '@/lib/supabase'
import { createAuditLog, getCurrentProfile } from '@/lib/auth'
import { Loader2, Plus, Banknote } from 'lucide-react'
import type { Repayment, Loan, Profile } from '@/lib/types'

export default function RepaymentsPage() {
  const [repayments, setRepayments] = useState<Repayment[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ loan_id: '', amount: '', payment_date: '', payment_method: 'cash', reference_number: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCurrentProfile().then(setProfile)
    loadData()
  }, [])

  async function loadData() {
    const [r, l] = await Promise.all([
      supabase.from('repayments').select('*').order('created_at', { ascending: false }),
      supabase.from('loans').select('*').in('status', ['active', 'funded', 'overdue']),
    ])
    setRepayments((r.data as Repayment[]) || [])
    setLoans((l.data as Loan[]) || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)

    const { error } = await supabase.from('repayments').insert({
      loan_id: form.loan_id,
      amount: Number(form.amount),
      payment_date: form.payment_date,
      payment_method: form.payment_method,
      reference_number: form.reference_number || null,
      recorded_by: profile.id,
    })

    if (!error) {
      await createAuditLog(profile.id, profile.full_name, 'Repayment recorded', 'repayment', form.loan_id, { amount: Number(form.amount) })
      setShowForm(false)
      setForm({ loan_id: '', amount: '', payment_date: '', payment_method: 'cash', reference_number: '' })
      loadData()
    }
    setSubmitting(false)
  }

  return (
    <AdminAuthGuard allowedRoles={['admin', 'loan_ops']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F9FAFB]">Repayments</h1>
            <p className="text-sm text-[#9CA3AF]">Record and track payments</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6]"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[#F9FAFB]">New Payment</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Loan</label>
                <select
                  value={form.loan_id}
                  onChange={(e) => setForm({ ...form, loan_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]"
                  required
                >
                  <option value="">Select loan</option>
                  {loans.map((l) => (
                    <option key={l.id} value={l.id}>{l.id.slice(0, 8)}... - Balance: ZMW {Number(l.total_repayable - l.amount_paid).toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Amount (ZMW)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Payment Date</label>
                <input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Payment Method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]">
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF]">Reference (optional)</label>
                <input type="text" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} className="mt-1 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={submitting} className="rounded-lg bg-[#6D28D9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6] disabled:opacity-50">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Payment'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#374151] px-4 py-2 text-sm font-medium text-[#9CA3AF] hover:bg-[#1F2937]">Cancel</button>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF]">Reference</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF]">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {repayments.map((r) => (
                  <tr key={r.id} className="border-b border-[#1F2937] hover:bg-[#111827]/50">
                    <td className="px-4 py-3 text-sm font-medium text-[#16A34A]">ZMW {Number(r.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{r.payment_method.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-[#F9FAFB]">{new Date(r.payment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">{r.reference_number || '-'}</td>
                    <td className="px-4 py-3 text-right text-sm text-[#9CA3AF]">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {repayments.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-[#6B7280]"><Banknote className="mx-auto mb-2 h-8 w-8 text-[#374151]" />No payments recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  )
}
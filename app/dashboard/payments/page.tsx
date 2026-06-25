'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CreditCard, Smartphone, Building2, CheckCircle, AlertCircle, Receipt, ArrowRight, Loader2 } from 'lucide-react'
import { LoadingSpinner, LoadingTable } from '@/components/ui/loading'
import type { Loan, Payment, RepaymentSchedule } from '@/lib/types'
import Link from 'next/link'

export default function PaymentsPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [schedules, setSchedules] = useState<RepaymentSchedule[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLoanId, setSelectedLoanId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mobile_money')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [loansRes, paymentsRes] = await Promise.all([
        supabase.from('loans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      const loansData = (loansRes.data as Loan[]) || []
      setLoans(loansData)
      setPayments((paymentsRes.data as Payment[]) || [])

      // Load repayment schedules
      if (loansData.length > 0) {
        const { data: schedData } = await supabase
          .from('repayment_schedule')
          .select('*')
          .in('loan_id', loansData.map((l) => l.id))
          .order('installment_number', { ascending: true })
        setSchedules((schedData as RepaymentSchedule[]) || [])
      }

      // Auto-select first active loan
      const activeLoan = loansData.find((l) => l.status === 'active')
      if (activeLoan) setSelectedLoanId(activeLoan.id)

      setLoading(false)
    }
    load()
  }, [])

  const formatCurrency = (amount: number) =>
    `ZMW ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const activeLoans = loans.filter((l) => l.status === 'active')
  const selectedLoan = loans.find((l) => l.id === selectedLoanId)
  const selectedSchedules = schedules.filter((s) => s.loan_id === selectedLoanId)

  // Find the earliest pending installment to suggest payment amount
  const nextInstallment = selectedSchedules.find((s) => s.status === 'pending' || s.status === 'overdue')

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in'); setSubmitting(false); return }

    if (!selectedLoanId) { setError('Please select a loan'); setSubmitting(false); return }

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) { setError('Please enter a valid payment amount'); setSubmitting(false); return }

    if (selectedLoan && amount > Number(selectedLoan.remaining_balance)) {
      setError(`Amount exceeds remaining balance of ${formatCurrency(Number(selectedLoan.remaining_balance))}`)
      setSubmitting(false)
      return
    }

    // Insert payment
    const { error: paymentError } = await supabase.from('payments').insert({
      loan_id: selectedLoanId,
      user_id: user.id,
      amount,
      method: paymentMethod,
    })

    if (paymentError) { setError(paymentError.message); setSubmitting(false); return }

    // Update loan balance
    if (selectedLoan) {
      const newRemainingBalance = Math.max(0, Number(selectedLoan.remaining_balance) - amount)
      const newStatus = newRemainingBalance <= 0 ? 'completed' : 'active'

      await supabase
        .from('loans')
        .update({ remaining_balance: newRemainingBalance, status: newStatus })
        .eq('id', selectedLoanId)

      // Update repayment schedule installments (mark as paid if amount covers it)
      if (selectedSchedules.length > 0) {
        const sortedByDueDate = [...selectedSchedules]
          .filter((s) => s.status !== 'paid')
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

        let remainingPaymentAmount = amount
        for (const installment of sortedByDueDate) {
          if (remainingPaymentAmount <= 0) break
          const installmentDue = Number(installment.amount_due)
          const amountForThisInstallment = Math.min(remainingPaymentAmount, installmentDue)

          if (amountForThisInstallment >= installmentDue) {
            // Full payment for this installment
            await supabase
              .from('repayment_schedule')
              .update({ status: 'paid', amount_paid: installmentDue, paid_at: new Date().toISOString() })
              .eq('id', installment.id)
            remainingPaymentAmount -= installmentDue
          } else {
            // Partial payment
            await supabase
              .from('repayment_schedule')
              .update({
                status: 'partial',
                amount_paid: Number(installment.amount_paid) + amountForThisInstallment,
              })
              .eq('id', installment.id)
            remainingPaymentAmount = 0
          }
        }
      }
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Payment Received',
      message: `Your payment of ${formatCurrency(amount)} has been received successfully.`,
      type: 'payment',
    })

    // Log event
    await supabase.from('loan_events').insert({
      loan_id: selectedLoanId,
      event_type: 'payment_received',
      metadata: { amount, method: paymentMethod },
      created_by: user.id,
    })

    // Reload data
    const [loansRes, paymentsRes] = await Promise.all([
      supabase.from('loans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    const newLoans = (loansRes.data as Loan[]) || []
    setLoans(newLoans)
    setPayments((paymentsRes.data as Payment[]) || [])

    if (newLoans.length > 0) {
      const { data: schedData } = await supabase
        .from('repayment_schedule')
        .select('*')
        .in('loan_id', newLoans.map((l) => l.id))
        .order('installment_number', { ascending: true })
      setSchedules((schedData as RepaymentSchedule[]) || [])
    }

    setPaymentAmount('')
    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => setSuccess(false), 5000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-700 mb-4" />
              <div className="space-y-3">
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-700" />
                <div className="h-24 w-full animate-pulse rounded-lg bg-gray-700" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-700" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-[#1F2937] bg-[#111827]">
              <div className="border-b border-[#1F2937] px-5 py-4">
                <div className="h-5 w-40 animate-pulse rounded bg-gray-700" />
              </div>
              <LoadingTable rows={4} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F9FAFB]">Payments</h1>
        <p className="text-sm text-[#9CA3AF]">Make payments on your active loans</p>
      </div>

      {activeLoans.length === 0 ? (
        <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-[#374151]" />
          <h3 className="mt-4 text-lg font-semibold text-[#F9FAFB]">No active loans</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            You don't have any active loans to make payments on. Loans become active only after disbursement.
          </p>
          <Link href="/dashboard/apply" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6]">
            Apply for a Loan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {success && (
            <div className="flex items-center gap-3 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-4">
              <CheckCircle className="h-6 w-6 text-[#16A34A]" />
              <div>
                <p className="text-sm font-medium text-[#16A34A]">Payment Successful!</p>
                <p className="text-xs text-[#9CA3AF]">Your payment has been recorded and your loan balance updated.</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <form onSubmit={handlePayment} className="space-y-4 rounded-xl border border-[#1F2937] bg-[#111827] p-5">
                <h2 className="text-sm font-semibold text-[#F9FAFB]">Make a Payment</h2>

                <div>
                  <label className="mb-1 block text-xs text-[#9CA3AF]">Select Loan</label>
                  <select
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] outline-none focus:border-[#6D28D9]"
                    required
                  >
                    <option value="">Choose a loan</option>
                    {activeLoans.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        #{loan.id.slice(0, 8)} - {formatCurrency(Number(loan.remaining_balance))} remaining
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLoan && (
                  <div className="space-y-1 rounded-lg bg-[#1F2937] p-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9CA3AF]">Principal</span>
                      <span className="text-[#F9FAFB]">{formatCurrency(Number(selectedLoan.principal))}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9CA3AF]">Total Repayable</span>
                      <span className="text-[#F9FAFB]">{formatCurrency(Number(selectedLoan.total_repayable))}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#9CA3AF]">Remaining Balance</span>
                      <span className="font-semibold text-[#16A34A]">{formatCurrency(Number(selectedLoan.remaining_balance))}</span>
                    </div>
                    {nextInstallment && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[#9CA3AF]">Next Installment Due</span>
                        <span className="text-[#EAB308]">{formatCurrency(Number(nextInstallment.amount_due))} ({new Date(nextInstallment.due_date).toLocaleDateString()})</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs text-[#9CA3AF]">Payment Amount (ZMW)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6D28D9]"
                    placeholder={nextInstallment ? `Suggested: ${formatCurrency(Number(nextInstallment.amount_due))}` : "Enter amount"}
                    min="1"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-[#9CA3AF]">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['mobile_money', 'bank', 'card'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors ${
                          paymentMethod === method
                            ? 'border-[#6D28D9] bg-[#6D28D9]/10 text-[#6D28D9]'
                            : 'border-[#374151] bg-[#1F2937] text-[#9CA3AF] hover:border-[#6D28D9]'
                        }`}
                      >
                        {method === 'mobile_money' ? <Smartphone className="h-5 w-5" /> :
                         method === 'bank' ? <Building2 className="h-5 w-5" /> :
                         <CreditCard className="h-5 w-5" />}
                        {method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-[#DC2626]/10 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-[#DC2626]" />
                    <p className="text-sm text-[#DC2626]">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6D28D9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B21B6] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? 'Processing...' : `Pay ${paymentAmount ? formatCurrency(parseFloat(paymentAmount)) : ''}`}
                </button>
              </form>
            </div>

            <div className="lg:col-span-3">
              <div className="rounded-xl border border-[#1F2937] bg-[#111827]">
                <div className="border-b border-[#1F2937] px-5 py-4">
                  <h2 className="text-sm font-semibold text-[#F9FAFB]">Payment History</h2>
                </div>

                {payments.length === 0 ? (
                  <div className="p-12 text-center">
                    <Receipt className="mx-auto h-10 w-10 text-[#374151]" />
                    <p className="mt-3 text-sm text-[#9CA3AF]">No payments made yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1F2937]">
                    {payments.map((payment) => {
                      const loan = loans.find((l) => l.id === payment.loan_id)
                      return (
                        <div key={payment.id} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16A34A]/10">
                              <CheckCircle className="h-4 w-4 text-[#16A34A]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#F9FAFB]">{formatCurrency(Number(payment.amount))}</p>
                              <p className="text-xs text-[#9CA3AF]">
                                {new Date(payment.created_at).toLocaleDateString()} • {payment.method.replace('_', ' ')}
                                {loan ? ` • Loan #${loan.id.slice(0, 8)}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-[#16A34A]">Completed</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
export type UserRole = 'client' | 'loan_ops' | 'admin'

export type ApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'rejected'

export type LoanStatus = 'approved' | 'funded' | 'active' | 'completed' | 'overdue' | 'defaulted'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  created_at: string
}

export interface Application {
  id: string
  client_id: string
  full_name: string
  phone: string
  nrc: string
  income: number
  loan_type: string
  requested_amount: number
  status: ApplicationStatus
  notes?: string
  submitted_at: string
  reviewed_by?: string
  reviewed_at?: string
}

export interface Loan {
  id: string
  application_id: string
  client_id: string
  approved_amount: number
  interest_rate: number
  loan_term_months: number
  due_date: string
  interest_amount: number
  total_repayable: number
  amount_paid: number
  status: LoanStatus
  approved_by: string
  approved_at: string
  created_at: string
}

export interface Disbursement {
  id: string
  loan_id: string
  transaction_id: string
  reference_number: string
  amount_sent: number
  date_sent: string
  confirmed_by: string
  confirmed_at: string
}

export interface Repayment {
  id: string
  loan_id: string
  amount: number
  payment_date: string
  payment_method: string
  reference_number?: string
  recorded_by: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  entity: string
  entity_id: string
  details?: Record<string, unknown>
  created_at: string
}

export interface DashboardMetrics {
  total_applications: number
  pending_review: number
  approved_loans: number
  active_loans: number
  total_disbursed: number
  overdue_loans: number
  collection_rate: number
}